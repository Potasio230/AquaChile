import os
import secrets
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from .repository import create_repository


load_dotenv(Path(__file__).resolve().parents[2] / ".env")
repository = create_repository()

app = FastAPI(title="AquaChile - API de Evaluaciones", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOKENS = {}
ESTADOS = {"POSTULADO", "EN_REVISION", "CITADO", "EVALUADO", "APTO", "NO_APTO", "CANCELADO"}
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}
MAX_CV_SIZE = 10 * 1024 * 1024


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
    repository.initialize()


@app.get("/api/salud")
def health():
    repository.ping()
    return {"estado": "ok", "persistencia": repository.name}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    user = repository.authenticate(payload.email, payload.clave)
    if not user:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    token = secrets.token_urlsafe(32)
    TOKENS[token] = user
    return {"token": token, "usuario": user}


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
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="El CV debe estar en formato PDF o Word")
    content = cv.file.read(MAX_CV_SIZE + 1)
    if len(content) > MAX_CV_SIZE:
        raise HTTPException(status_code=400, detail="El CV supera el máximo de 10 MB")

    code = f"AQ-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(3).upper()}"
    cv_reference = repository.save_cv(code, cv.filename, cv.content_type, content)
    record = {
        "codigo": code,
        "rut": rut.strip(),
        "nombre_completo": nombre.strip(),
        "email": email.strip(),
        "telefono": telefono.strip(),
        "cargo": cargo,
        "familia_cargo": familia_cargo,
        "centro_trabajo": centro_trabajo,
        "localidad": localidad,
        "area": area,
        "turno": turno,
        "analista": analista,
        "correo_analista": correo_analista,
        "fecha_informe": fecha_informe,
        "observaciones": observaciones,
        "cv_nombre": cv.filename,
        "cv_referencia": cv_reference,
    }
    application_id = repository.create_application(record)
    return {"id": application_id, "codigo": code, "mensaje": "Postulación registrada correctamente"}


@app.get("/api/postulaciones")
def list_applications(authorization: str | None = Header(default=None)):
    require_user(authorization)
    return repository.list_applications()


@app.get("/api/postulaciones/{application_id}")
def get_application(application_id: str, authorization: str | None = Header(default=None)):
    require_user(authorization)
    record = repository.get_application(application_id)
    if not record:
        raise HTTPException(status_code=404, detail="Postulación no encontrada")
    return record


@app.get("/api/postulaciones/{application_id}/cv")
def download_cv(application_id: str, authorization: str | None = Header(default=None)):
    require_user(authorization)
    stored_file = repository.get_cv(application_id)
    if not stored_file:
        raise HTTPException(status_code=404, detail="Currículum no encontrado")
    filename, content_type, content = stored_file
    return Response(
        content=content,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.patch("/api/postulaciones/{application_id}/evaluacion")
def update_evaluation(
    application_id: str,
    payload: EvaluacionRequest,
    authorization: str | None = Header(default=None),
):
    user = require_user(authorization)
    new_status = payload.estado.upper()
    if new_status not in ESTADOS:
        raise HTTPException(status_code=400, detail="Estado de evaluación inválido")
    updated = repository.update_evaluation(
        application_id, new_status, payload.resultado, payload.nota_evaluacion, user["email"]
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Postulación no encontrada")
    return {"mensaje": "Evaluación actualizada", "estado": new_status}


@app.get("/api/dashboard/resumen")
def dashboard_summary(authorization: str | None = Header(default=None)):
    require_user(authorization)
    return repository.summary()

