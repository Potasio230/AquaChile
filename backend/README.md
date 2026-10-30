# Backend de integración con MongoDB

Este servicio usa FastAPI y admite MongoDB Atlas para que la aplicación pueda
desplegarse. Conserva SQLite únicamente como respaldo local sin Internet.

## Inicio

```bash
cp ../.env.example ../.env
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api.app:app --reload --port 8000
```

Documentación de la API: `http://127.0.0.1:8000/docs`

## Configuración MongoDB Atlas

1. Crea un cluster gratuito en MongoDB Atlas.
2. Crea un usuario técnico de base de datos.
3. Autoriza la dirección IP del backend desplegado.
4. Copia `.env.example` como `.env`.
5. Reemplaza `MONGODB_URI` con la cadena entregada por Atlas.
6. No compartas ni subas `.env` a GitHub.

Al iniciar la API se crean automáticamente las colecciones `usuarios`,
`postulaciones`, `auditorias`, `curriculums.files` y `curriculums.chunks`, junto
con sus índices. Los currículums se guardan usando GridFS.

Acceso interno de demostración:

- Correo: `rrhh@aquachile.demo`
- Contraseña: `AquaChile2026`

En modo SQLite los datos se crean en `backend/data/aquachile.db` y los CV en
`backend/uploads/`. Estos archivos están excluidos de Git.

