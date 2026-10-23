import secrets
import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import BASE_DIR, connect, init_database


app = FastAPI(title="AquaChile - API de Evaluaciones", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOKENS = {}
ESTADOS = {"POSTULADO", "EN_REVISION", "CITADO", "EVALUADO", "APTO", "NO_APTO", "CANCELADO"}
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class LoginRequest(BaseModel):
    email: str
    clave: str


class EvaluacionRequest(BaseModel):
    estado: str
    resultado: str | None = None
    nota_evaluacion: str | None = None


def require_user(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Debes iniciar sesión")
    user = TOKENS.get(authorization.removeprefix("Bearer "))
    if not user:
        raise HTTPException(status_code=401, detail="La sesión expiró")
    return user


@app.on_event("startup")
def startup():
    init_database()


@app.get("/api/salud")
def health():
    return {"estado": "ok", "persistencia": "sqlite-local"}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    with connect() as db:
        user = db.execute(
            "SELECT id_usuario, nombre, email, rol FROM usuario WHERE lower(email) = lower(?) AND clave = ? AND activo = 1",
            (payload.email.strip(), payload.clave),
        ).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    token = secrets.token_urlsafe(32)
    public_user = dict(user)
    TOKENS[token] = public_user
    return {"token": token, "usuario": public_user}


@app.post("/api/postulaciones", status_code=201)
def create_application(
    nombre: str = Form(...),
    rut: str = Form(...),
    email: str = Form(...),
    telefono: str = Form(""),
    cargo: str = Form(...),
    familia_cargo: str = Form(...),
    centro_trabajo: str = Form(...),
    localidad: str = Form(...),
    area: str = Form(...),
    turno: str = Form(...),
    analista: str = Form(...),
    correo_analista: str = Form(...),
    fecha_informe: str = Form(...),
    observaciones: str = Form(""),
    cv: UploadFile = File(...),
):
    extension = Path(cv.filename or "").suffix.lower()
    if extension not in {".pdf", ".doc", ".docx"}:
        raise HTTPException(status_code=400, detail="El CV debe estar en formato PDF o Word")

    code = f"AQ-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(3).upper()}"
    stored_name = f"{code}{extension}"
    destination = UPLOAD_DIR / stored_name
    with destination.open("wb") as output:
        shutil.copyfileobj(cv.file, output)
    if destination.stat().st_size > 10 * 1024 * 1024:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="El CV supera el máximo de 10 MB")

    with connect() as db:
        cursor = db.execute(
            """
            INSERT INTO postulacion (
                codigo, rut, nombre_completo, email, telefono, cargo, familia_cargo,
                centro_trabajo, localidad, area, turno, analista, correo_analista,
                fecha_informe, observaciones, cv_nombre, cv_ruta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                code, rut.strip(), nombre.strip(), email.strip(), telefono.strip(), cargo,
                familia_cargo, centro_trabajo, localidad, area, turno, analista,
                correo_analista, fecha_informe, observaciones, cv.filename, str(destination),
            ),
        )
        application_id = cursor.lastrowid
        db.execute(
            "INSERT INTO auditoria (id_postulacion, estado_nuevo, usuario) VALUES (?, 'POSTULADO', 'FORMULARIO_PUBLICO')",
            (application_id,),
        )
        db.commit()
    return {"id": application_id, "codigo": code, "mensaje": "Postulación registrada correctamente"}


@app.get("/api/postulaciones")
def list_applications(authorization: str | None = Header(default=None)):
    require_user(authorization)
    with connect() as db:
        rows = db.execute(
            """
            SELECT id_postulacion AS id, codigo, nombre_completo, rut, email, telefono,
                   cargo, centro_trabajo, localidad, turno, estado, resultado,
                   fecha_informe, fecha_registro
            FROM postulacion ORDER BY id_postulacion DESC
            """
        ).fetchall()
    return [dict(row) for row in rows]


@app.get("/api/postulaciones/{application_id}")
def get_application(application_id: int, authorization: str | None = Header(default=None)):
    require_user(authorization)
    with connect() as db:
        row = db.execute(
            "SELECT * FROM postulacion WHERE id_postulacion = ?", (application_id,)
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Postulación no encontrada")
    return dict(row)


@app.patch("/api/postulaciones/{application_id}/evaluacion")
def update_evaluation(
    application_id: int,
    payload: EvaluacionRequest,
    authorization: str | None = Header(default=None),
):
    user = require_user(authorization)
    new_status = payload.estado.upper()
    if new_status not in ESTADOS:
        raise HTTPException(status_code=400, detail="Estado de evaluación inválido")

    with connect() as db:
        current = db.execute(
            "SELECT estado FROM postulacion WHERE id_postulacion = ?", (application_id,)
        ).fetchone()
        if not current:
            raise HTTPException(status_code=404, detail="Postulación no encontrada")
        db.execute(
            """
            UPDATE postulacion
               SET estado = ?, resultado = ?, nota_evaluacion = ?, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id_postulacion = ?
            """,
            (new_status, payload.resultado, payload.nota_evaluacion, application_id),
        )
        db.execute(
            """
            INSERT INTO auditoria (id_postulacion, estado_anterior, estado_nuevo, usuario)
            VALUES (?, ?, ?, ?)
            """,
            (application_id, current["estado"], new_status, user["email"]),
        )
        db.commit()
    return {"mensaje": "Evaluación actualizada", "estado": new_status}


@app.get("/api/dashboard/resumen")
def dashboard_summary(authorization: str | None = Header(default=None)):
    require_user(authorization)
    with connect() as db:
        total = db.execute("SELECT COUNT(*) FROM postulacion").fetchone()[0]
        pending = db.execute(
            "SELECT COUNT(*) FROM postulacion WHERE estado IN ('POSTULADO', 'EN_REVISION', 'CITADO')"
        ).fetchone()[0]
        evaluated = db.execute(
            "SELECT COUNT(*) FROM postulacion WHERE estado IN ('EVALUADO', 'APTO', 'NO_APTO')"
        ).fetchone()[0]
    return {"total": total, "pendientes": pending, "evaluados": evaluated}

