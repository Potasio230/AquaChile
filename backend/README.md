# Backend local de integración

Este servicio permite probar el flujo completo sin depender del agente externo. Usa FastAPI y una base SQLite local para la demostración. El esquema Oracle oficial del proyecto sigue disponible en `database/` y debe instalarse en SQL Developer para la entrega de Base de Datos.

## Inicio

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api.app:app --reload --port 8000
```

Documentación de la API: `http://127.0.0.1:8000/docs`

Acceso interno de demostración:

- Correo: `rrhh@aquachile.demo`
- Contraseña: `AquaChile2026`

Los datos locales se crean en `backend/data/aquachile.db` y los CV en `backend/uploads/`. Estos archivos están excluidos de Git.

