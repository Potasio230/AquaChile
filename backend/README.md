# Backend de integración con MongoDB

Este servicio usa FastAPI y admite MongoDB Atlas para que la aplicación pueda
desplegarse. Conserva SQLite únicamente como respaldo local sin Internet.

## Inicio en Windows (PowerShell)

```powershell
Copy-Item .env.example .env
# En .env, usa AQUACHILE_DB_MODE=sqlite para iniciar sin MongoDB Atlas.
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python -m uvicorn api.app:app --app-dir backend --reload --port 8001
```

Documentación de la API: `http://127.0.0.1:8001/docs`

El frontend de desarrollo (Vite) redirige `/api` a este puerto. Si cambiás el
puerto del backend, actualizá `VITE_API_PROXY_TARGET` en `.env`.

Ejecuta estos comandos desde la carpeta raíz del repositorio. El archivo `.env`
se lee desde esa carpeta.

### Inicio en macOS / Linux

```bash
cp .env.example .env
# En .env, usa AQUACHILE_DB_MODE=sqlite para iniciar sin MongoDB Atlas.
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
python -m uvicorn api.app:app --app-dir backend --reload --port 8001
```

## Configuración MongoDB Atlas

1. Crea un cluster gratuito en MongoDB Atlas.
2. Crea un usuario técnico de base de datos.
3. Autoriza la dirección IP del backend desplegado.
4. Copia `.env.example` como `.env` en la raíz del repositorio.
5. Reemplaza `MONGODB_URI` con la cadena entregada por Atlas y configura `AQUACHILE_DB_MODE=mongodb`.
6. No publiques `.env` en repositorios públicos: contiene credenciales. Usa una contraseña de aplicación exclusiva y revócala si se filtra.

Al iniciar la API se crean automáticamente las colecciones `usuarios`,
`postulaciones`, `auditorias`, `solicitudes_evaluacion`, `curriculums.files` y
`curriculums.chunks`, junto con sus índices. Los currículums se guardan usando GridFS. Las contraseñas se
almacenan con PBKDF2; las credenciales previas en texto plano se migran al hash
correcto cuando el usuario inicia sesión correctamente.

Acceso interno de demostración:

- Correo: `rrhh@aquachile.demo`
- Contraseña: `AquaChile2026`

En modo SQLite los datos se crean en `backend/data/aquachile.db` y los CV en
`backend/uploads/`. Estos archivos están excluidos de Git.

## Envío de correos

El backend envía una confirmación al correo del candidato y una notificación al
correo del analista indicado en el formulario. La notificación del analista lleva
el currículum adjunto. Los mensajes se envían mediante la API REST de Resend.
Configura estas variables en `.env`:

```dotenv
RESEND_API_KEY=re_TU_CLAVE_AQUI
RESEND_FROM=AquaChile <onboarding@resend.dev>
RESEND_TIMEOUT_SECONDS=10
PUBLIC_APP_URL=http://localhost:5173
INTERNAL_APP_URL=http://localhost:5173
```

En modo prueba, `onboarding@resend.dev` solo puede enviar a los correos
verificados en tu cuenta de Resend. Para usar tu propio dominio, verifícalo en
Resend y cambia `RESEND_FROM`. No publiques `RESEND_API_KEY` en un repositorio
público: revócala si se filtra. Si Resend no está configurado o falla, la
postulación se conserva en la base de datos y el formulario informa que el correo
no se envió.

## Pruebas del backend

Desde la raíz del repositorio:

```powershell
backend/.venv/Scripts/python -m unittest discover -s backend/tests -v
```

