# Backend de integración con MongoDB

Este servicio usa FastAPI y admite MongoDB Atlas para que la aplicación pueda
desplegarse. Conserva SQLite únicamente como respaldo local sin Internet.

## Inicio en Windows (PowerShell)

```bash
Copy-Item .env.example .env
# En .env, usa AQUACHILE_DB_MODE=sqlite para iniciar sin MongoDB Atlas.
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python -m uvicorn api.app:app --app-dir backend --reload --port 8000
```

Documentación de la API: `http://127.0.0.1:8000/docs`

Ejecuta estos comandos desde la carpeta raíz del repositorio. El archivo `.env`
se lee desde esa carpeta.

### Inicio en macOS / Linux

```bash
cp .env.example .env
# En .env, usa AQUACHILE_DB_MODE=sqlite para iniciar sin MongoDB Atlas.
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn api.app:app --app-dir backend --reload --port 8000
```

## Configuración MongoDB Atlas

1. Crea un cluster gratuito en MongoDB Atlas.
2. Crea un usuario técnico de base de datos.
3. Autoriza la dirección IP del backend desplegado.
4. Copia `.env.example` como `.env` en la raíz del repositorio.
5. Reemplaza `MONGODB_URI` con la cadena entregada por Atlas y configura `AQUACHILE_DB_MODE=mongodb`.
6. No compartas ni subas `.env` a GitHub.

Al iniciar la API se crean automáticamente las colecciones `usuarios`,
`postulaciones`, `auditorias`, `curriculums.files` y `curriculums.chunks`, junto
con sus índices. Los currículums se guardan usando GridFS. Las contraseñas se
almacenan con PBKDF2; las credenciales previas en texto plano se migran al hash
correcto cuando el usuario inicia sesión correctamente.

Acceso interno de demostración:

- Correo: `rrhh@aquachile.demo`
- Contraseña: `AquaChile2026`

En modo SQLite los datos se crean en `backend/data/aquachile.db` y los CV en
`backend/uploads/`. Estos archivos están excluidos de Git.

## Pruebas del backend

Desde la raíz del repositorio:

```powershell
backend/.venv/Scripts/python -m unittest discover -s backend/tests -v
```

