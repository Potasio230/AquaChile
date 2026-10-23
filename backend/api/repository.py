import os
import re
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from gridfs import GridFS
from pymongo import ASCENDING, DESCENDING, MongoClient

from .database import BASE_DIR, connect, init_database


DEMO_USER = {
    "nombre": "Paula Gutiérrez",
    "email": "rrhh@aquachile.demo",
    "rol": "ADMIN",
    "clave": "AquaChile2026",
    "activo": True,
}


class SQLiteRepository:
    name = "sqlite-local"

    def initialize(self):
        init_database()

    def ping(self):
        with connect() as db:
            db.execute("SELECT 1").fetchone()

    def authenticate(self, email, password):
        with connect() as db:
            user = db.execute(
                "SELECT id_usuario, nombre, email, rol FROM usuario WHERE lower(email) = lower(?) AND clave = ? AND activo = 1",
                (email.strip(), password),
            ).fetchone()
        return dict(user) if user else None

    def save_cv(self, code, filename, content_type, content):
        extension = Path(filename).suffix.lower()
        upload_dir = BASE_DIR / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        destination = upload_dir / f"{code}{extension}"
        destination.write_bytes(content)
        return str(destination)

    def create_application(self, record):
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
                    record["codigo"], record["rut"], record["nombre_completo"], record["email"],
                    record["telefono"], record["cargo"], record["familia_cargo"],
                    record["centro_trabajo"], record["localidad"], record["area"], record["turno"],
                    record["analista"], record["correo_analista"], record["fecha_informe"],
                    record["observaciones"], record["cv_nombre"], record["cv_referencia"],
                ),
            )
            application_id = cursor.lastrowid
            db.execute(
                "INSERT INTO auditoria (id_postulacion, estado_nuevo, usuario) VALUES (?, 'POSTULADO', 'FORMULARIO_PUBLICO')",
                (application_id,),
            )
            db.commit()
        return str(application_id)

    def list_applications(self):
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

    def get_application(self, application_id):
        try:
            numeric_id = int(application_id)
        except ValueError:
            return None
        with connect() as db:
            row = db.execute("SELECT * FROM postulacion WHERE id_postulacion = ?", (numeric_id,)).fetchone()
        return dict(row) if row else None

    def update_evaluation(self, application_id, status, result, notes, user_email):
        try:
            numeric_id = int(application_id)
        except ValueError:
            return False
        with connect() as db:
            current = db.execute("SELECT estado FROM postulacion WHERE id_postulacion = ?", (numeric_id,)).fetchone()
            if not current:
                return False
            db.execute(
                """UPDATE postulacion SET estado = ?, resultado = ?, nota_evaluacion = ?,
                   fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_postulacion = ?""",
                (status, result, notes, numeric_id),
            )
            db.execute(
                "INSERT INTO auditoria (id_postulacion, estado_anterior, estado_nuevo, usuario) VALUES (?, ?, ?, ?)",
                (numeric_id, current["estado"], status, user_email),
            )
            db.commit()
        return True

    def summary(self):
        with connect() as db:
            total = db.execute("SELECT COUNT(*) FROM postulacion").fetchone()[0]
            pending = db.execute("SELECT COUNT(*) FROM postulacion WHERE estado IN ('POSTULADO', 'EN_REVISION', 'CITADO')").fetchone()[0]
            evaluated = db.execute("SELECT COUNT(*) FROM postulacion WHERE estado IN ('EVALUADO', 'APTO', 'NO_APTO')").fetchone()[0]
        return {"total": total, "pendientes": pending, "evaluados": evaluated}

    def get_cv(self, application_id):
        record = self.get_application(application_id)
        if not record or not record.get("cv_ruta"):
            return None
        path = Path(record["cv_ruta"])
        if not path.exists():
            return None
        return record["cv_nombre"], "application/octet-stream", path.read_bytes()


class MongoRepository:
    name = "mongodb"

    def __init__(self, uri, database_name):
        self.client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        self.db = self.client[database_name]
        self.files = GridFS(self.db, collection="curriculums")

    def initialize(self):
        self.ping()
        self.db.usuarios.create_index([("email", ASCENDING)], unique=True)
        self.db.postulaciones.create_index([("codigo", ASCENDING)], unique=True)
        self.db.postulaciones.create_index([("fecha_registro", DESCENDING)])
        self.db.auditorias.create_index([("id_postulacion", ASCENDING), ("fecha_evento", DESCENDING)])
        self.db.usuarios.update_one(
            {"email": DEMO_USER["email"]}, {"$setOnInsert": DEMO_USER}, upsert=True
        )

    def ping(self):
        self.client.admin.command("ping")

    @staticmethod
    def _serialize(document):
        if not document:
            return None
        result = dict(document)
        result["id"] = str(result.pop("_id"))
        for key, value in tuple(result.items()):
            if isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, ObjectId):
                result[key] = str(value)
        return result

    def authenticate(self, email, password):
        user = self.db.usuarios.find_one({"email": {"$regex": f"^{re.escape(email.strip())}$", "$options": "i"}, "clave": password, "activo": True})
        if not user:
            return None
        public_user = self._serialize(user)
        public_user.pop("clave", None)
        return public_user

    def save_cv(self, code, filename, content_type, content):
        file_id = self.files.put(content, filename=filename, content_type=content_type, codigo=code)
        return str(file_id)

    def create_application(self, record):
        now = datetime.now(timezone.utc)
        record = dict(record)
        cv_reference = record.pop("cv_referencia")
        document = {
            **record,
            "cv_file_id": ObjectId(cv_reference),
            "estado": "POSTULADO",
            "resultado": None,
            "nota_evaluacion": None,
            "fecha_registro": now,
            "fecha_actualizacion": now,
        }
        result = self.db.postulaciones.insert_one(document)
        self.db.auditorias.insert_one({
            "id_postulacion": result.inserted_id,
            "estado_anterior": None,
            "estado_nuevo": "POSTULADO",
            "usuario": "FORMULARIO_PUBLICO",
            "fecha_evento": now,
        })
        return str(result.inserted_id)

    def list_applications(self):
        projection = {"cv_file_id": 0, "observaciones": 0, "nota_evaluacion": 0}
        return [self._serialize(item) for item in self.db.postulaciones.find({}, projection).sort("fecha_registro", DESCENDING)]

    def get_application(self, application_id):
        if not ObjectId.is_valid(application_id):
            return None
        return self._serialize(self.db.postulaciones.find_one({"_id": ObjectId(application_id)}, {"cv_file_id": 0}))

    def update_evaluation(self, application_id, status, result, notes, user_email):
        if not ObjectId.is_valid(application_id):
            return False
        object_id = ObjectId(application_id)
        current = self.db.postulaciones.find_one({"_id": object_id}, {"estado": 1})
        if not current:
            return False
        now = datetime.now(timezone.utc)
        self.db.postulaciones.update_one(
            {"_id": object_id},
            {"$set": {"estado": status, "resultado": result, "nota_evaluacion": notes, "fecha_actualizacion": now}},
        )
        self.db.auditorias.insert_one({
            "id_postulacion": object_id,
            "estado_anterior": current["estado"],
            "estado_nuevo": status,
            "usuario": user_email,
            "fecha_evento": now,
        })
        return True

    def summary(self):
        return {
            "total": self.db.postulaciones.count_documents({}),
            "pendientes": self.db.postulaciones.count_documents({"estado": {"$in": ["POSTULADO", "EN_REVISION", "CITADO"]}}),
            "evaluados": self.db.postulaciones.count_documents({"estado": {"$in": ["EVALUADO", "APTO", "NO_APTO"]}}),
        }

    def get_cv(self, application_id):
        if not ObjectId.is_valid(application_id):
            return None
        record = self.db.postulaciones.find_one({"_id": ObjectId(application_id)}, {"cv_file_id": 1, "cv_nombre": 1})
        if not record or not record.get("cv_file_id"):
            return None
        stored = self.files.get(record["cv_file_id"])
        return record["cv_nombre"], stored.content_type or "application/octet-stream", stored.read()


def create_repository():
    mode = os.getenv("AQUACHILE_DB_MODE", "sqlite").lower()
    if mode == "mongodb":
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise RuntimeError("MONGODB_URI es obligatorio cuando AQUACHILE_DB_MODE=mongodb")
        return MongoRepository(uri, os.getenv("MONGODB_DATABASE", "aquachile"))
    return SQLiteRepository()

