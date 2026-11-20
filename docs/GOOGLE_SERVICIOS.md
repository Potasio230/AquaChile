# Drive y Calendar: configuración y verificación

## Alcance

Los nuevos CV se guardan en Drive, en una carpeta privada por envío con nombre del
postulante y código único. No se modifica ningún permiso ni se publica un enlace.
MongoDB guarda `cv_drive` (archivo, carpeta y MIME); SQLite almacena el mismo objeto
como JSON en `cv_ruta`. El endpoint autenticado de descarga entrega el contenido.
Los documentos históricos de GridFS/archivos locales siguen siendo descargables.
No se migran ni eliminan los CV anteriores.

Calendar se utiliza desde la ficha interna de una postulación. Se guarda una cita
por postulación y se reprograma con PATCH, sin asistentes, CV adjuntos ni invitaciones.
El título usa el código, no datos psicolaborales. La zona de presentación es Chile;
el formulario recibe la hora del dispositivo y transmite un instante ISO con zona.
El ID de evento es determinista para evitar duplicados en reintentos.

Esto no implementa el CRUD de ofertas, JWT ni IA de la rúbrica. La asociación a una
oferta real sigue pendiente del módulo de ofertas; no se inventa un identificador.

## Autorizar la cuenta del proyecto (una vez por entorno)

1. En Google Cloud, elegir/crear un proyecto y habilitar Google Drive API y Google
   Calendar API. Configurar la pantalla OAuth y añadir la cuenta de demostración
   como usuario de prueba si la aplicación está en modo Testing.
2. Crear un cliente OAuth de **aplicación de escritorio**, descargar su JSON y
   guardarlo localmente como `.secrets/google-client.json`. No usar la contraseña de Gmail.
3. Desde la raíz del proyecto, instalar las dependencias del backend en su entorno:
   `python -m pip install -r backend/requirements.txt`.
4. Ejecutar `python backend/scripts/authorize_google.py --client .secrets/google-client.json`.
   El dueño de la cuenta debe verificar el correo y autorizar los permisos en Google.
   No continuar con una cuenta personal equivocada ni eludir avisos de seguridad.
5. Configurar en el `.env` privado (conservar MongoDB y SMTP existentes):

```dotenv
CV_STORAGE=drive
GOOGLE_TOKEN_FILE=.secrets/google-token.json
GOOGLE_CALENDAR_ID=primary
VITE_API_PROXY_TARGET=http://127.0.0.1:8001
```

6. Reiniciar backend (`python -m uvicorn api.app:app --app-dir backend --port 8001`)
   y frontend (`npm run dev`). La carpeta `.secrets` debe existir en el servidor
   del backend, nunca en `public`, `src` ni en el paquete del frontend.

Permisos solicitados: `drive.file` (archivos de esta app) y `calendar.events`.
El token se renueva en servidor mediante OAuth; si la autorización se revoca/caduca
hay que autorizar nuevamente. Los refresh tokens de apps en modo Testing pueden
tener duración limitada. No compartir tokens ni JSON de credenciales por GitHub.
El script se niega a sobrescribir un token: usar otro `--output` y actualizar
GOOGLE_TOKEN_FILE si hace falta una autorización nueva.

## Verificación sin servicios externos

```sh
python -m pip install -r backend/requirements-test.txt
python -m unittest discover -s backend/tests -v
npm test
npm run build
```

Las pruebas usan SQLite temporal y dobles de Google: NO prueban permisos reales,
cuotas, entrega de correos ni la cuenta conectada. No alteran Atlas ni Drive.

## Verificación real (solo datos ficticios)

Enviar un CV de prueba válido; comprobar carpeta y archivo privados en la cuenta
autorizada, referencia en MongoDB y descarga con sesión. Comprobar rechazo sin sesión.
Abrir ficha interna, seleccionar fecha futura y guardar la entrevista. Verificar
en Calendar, recargar la ficha y reprogramar: debe existir una sola cita.

Sin credenciales, Drive devuelve un error y no cambia silenciosamente a GridFS.
Para demostración sin Google se puede elegir explícitamente `CV_STORAGE=legacy`;
ese modo conserva el almacenamiento original y no cumple la carpeta de Drive.

## Fallos y límites

- Si falla subir el archivo después de crear su carpeta, se intenta mover esa nueva
  carpeta a papelera (recuperable). Si Google no responde, revisar carpetas vacías.
- Si falla confirmar el guardado en BD, se conserva el CV privado para recuperación:
  un timeout podría haber guardado el registro. Revisar el código antes de reenviar.
- Guardado en Google y BD no es una transacción distribuida; para producción faltan
  reconciliación automática y límites/antibot en el formulario público.
- La validación comprueba extensión, tamaño y firma básica; no es un antivirus.
- El login interno sigue siendo el de demostración del proyecto, con verificación
  de roles internos añadida. No es JWT ni autoriza producción con datos reales.
- No se marca CITADO automáticamente: agendar sin invitados no demuestra que el
  candidato haya recibido una citación. El personal controla el estado.

Referencias: https://developers.google.com/workspace/drive/api/guides/manage-uploads
https://developers.google.com/workspace/calendar/api/v3/reference/events/insert
https://developers.google.com/identity/protocols/oauth2/native-app
