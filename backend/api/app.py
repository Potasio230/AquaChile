import os
import secrets
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from io import BytesIO
from zipfile import ZipFile, BadZipFile

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

from .repository import create_repository
from .email_service import send_application_notifications
from . import google_services


load_dotenv(Path(__file__).resolve().parents[2] / ".env")
repository = create_repository()

app = FastAPI(title="AquaChile - API de Evaluaciones", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
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


class CitaRequest(BaseModel):
    inicio: datetime
    duracion_minutos: int = Field(default=60, ge=15, le=180)


def require_user(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Debes iniciar sesión")
    user = TOKENS.get(authorization.removeprefix("Bearer "))
    if not user:
        raise HTTPException(status_code=401, detail="La sesión expiró")
    if user.get('rol') not in {'ADMIN', 'ANALISTA', 'PSICOLOGO'}:
        raise HTTPException(status_code=403, detail='No tienes permisos para esta función interna')
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

    if not nombre.strip() or len(nombre.strip()) > 150 or not content:
        raise HTTPException(422, 'Indica un nombre válido y un CV no vacío')
    mime = {'.pdf': 'application/pdf', '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}[extension]
    valid_file = content.startswith(b'%PDF-') if extension == '.pdf' else content.startswith(bytes.fromhex('D0CF11E0A1B11AE1'))
    if extension == '.docx':
        try:
            with ZipFile(BytesIO(content)) as archive:
                valid_file = 'word/document.xml' in archive.namelist() and '[Content_Types].xml' in archive.namelist()
        except BadZipFile:
            valid_file = False
    if not valid_file:
        raise HTTPException(400, 'El contenido del archivo no corresponde a PDF o Word')
    filename = Path(cv.filename.replace('\\', '/')).name
    filename = ''.join(c for c in filename if ord(c) >= 32)[:180]
    code = f"AQ-{datetime.now(timezone.utc):%Y%m%d}-{secrets.token_hex(8).upper()}"
    storage = os.getenv('CV_STORAGE', 'drive').lower()
    if storage not in {'drive', 'legacy'}:
        raise HTTPException(503, 'CV_STORAGE debe ser drive o legacy')
    cv_reference = (google_services.upload_cv(code, nombre.strip(), filename, mime, content)
                    if storage == 'drive' else repository.save_cv(code, filename, mime, content))
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
        "cv_nombre": filename,
        "cv_referencia": cv_reference,
    }
    try:
        application_id = repository.create_application(record)
    except Exception:
        # A DB timeout may have committed the record: preserve the private CV for recovery.
        raise HTTPException(503, f'No se pudo confirmar el registro. Solicita revisión con el código {code} antes de reenviar.') from None
    email_status = send_application_notifications(record, content, cv.content_type)
    return {
        "id": application_id,
        "codigo": code,
        "mensaje": "Postulación registrada correctamente",
        "notificacion_email": email_status["estado"],
    }


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
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename, safe='')}"},
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


@app.get('/api/integraciones/google')
def google_configuration(authorization: str | None = Header(default=None)):
    require_user(authorization)
    return {'credenciales_presentes': google_services.credentials_path().is_file(),
            'almacenamiento_nuevos_cv': os.getenv('CV_STORAGE', 'drive')}


@app.post('/api/postulaciones/{application_id}/entrevista')
def schedule_interview(application_id: str, payload: CitaRequest, authorization: str | None = Header(default=None)):
    user = require_user(authorization)
    record = repository.get_application(application_id)
    if not record:
        raise HTTPException(404, 'Postulación no encontrada')
    event = google_services.calendar_event(record, payload.inicio, payload.duracion_minutos)
    try:
        if not repository.save_calendar(application_id, event, user['email']):
            raise ValueError('Postulación no disponible')
    except Exception:
        raise HTTPException(503, 'Google guardó la cita pero no se confirmó en la base. Reintenta con la misma fecha; no se duplicará el evento.') from None
    return {'mensaje': 'Entrevista guardada en Google Calendar', 'calendar': event}

