import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from .security import hash_password

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = Path(os.getenv("AQUACHILE_SQLITE_PATH", BASE_DIR / "data" / "aquachile.db"))


@contextmanager
def connect():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def init_database():
    with connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                rol TEXT NOT NULL CHECK (rol IN ('ADMIN', 'ANALISTA', 'PSICOLOGO')),
                clave TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS postulacion (
                id_postulacion INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo TEXT UNIQUE,
                rut TEXT NOT NULL,
                nombre_completo TEXT NOT NULL,
                email TEXT NOT NULL,
                telefono TEXT,
                cargo TEXT NOT NULL,
                familia_cargo TEXT NOT NULL,
                centro_trabajo TEXT NOT NULL,
                localidad TEXT NOT NULL,
                area TEXT NOT NULL,
                turno TEXT NOT NULL,
                analista TEXT NOT NULL,
                correo_analista TEXT NOT NULL,
                fecha_informe TEXT NOT NULL,
                observaciones TEXT,
                cv_nombre TEXT,
                cv_ruta TEXT,
                estado TEXT NOT NULL DEFAULT 'POSTULADO',
                resultado TEXT,
                nota_evaluacion TEXT,
                fecha_registro TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS auditoria (
                id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
                id_postulacion INTEGER NOT NULL,
                estado_anterior TEXT,
                estado_nuevo TEXT NOT NULL,
                usuario TEXT NOT NULL,
                fecha_evento TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_postulacion) REFERENCES postulacion(id_postulacion)
            );
            """
        )
        db.execute(
            """
            INSERT OR IGNORE INTO usuario (nombre, email, rol, clave)
            VALUES (?, ?, ?, ?)
            """,
            ("Paula Gutiérrez", "rrhh@aquachile.demo", "ADMIN", hash_password("AquaChile2026")),
        )
        db.commit()

