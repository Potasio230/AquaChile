"""Google integrations: credentials and file content never pass through React."""
import hashlib
import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[2]


def credentials_path():
    path = Path(os.getenv('GOOGLE_TOKEN_FILE', '.secrets/google-token.json'))
    return path if path.is_absolute() else ROOT / path


def access_token():
    # Load lazily: the existing application can run without Google configured.
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request as AuthRequest
    try:
        credentials = Credentials.from_authorized_user_file(str(credentials_path()))
        if not credentials.valid:
            credentials.refresh(AuthRequest())
        return credentials.token
    except Exception:
        raise HTTPException(503, 'Google no está autorizado o la autorización caducó. Ejecuta la configuración OAuth del backend.') from None


def google_request(url, method='GET', payload=None, raw=None, content_type=None, binary=False):
    headers = {'Authorization': f'Bearer {access_token()}'}
    if payload is not None:
        raw = json.dumps(payload).encode()
        content_type = 'application/json'
    if content_type:
        headers['Content-Type'] = content_type
    try:
        with urlopen(Request(url, data=raw, headers=headers, method=method), timeout=30) as response:
            body = response.read()
            return body if binary else json.loads(body or b'{}')
    except HTTPError as error:
        # Do not expose upstream bodies, tokens, or personal information.
        messages = {401: 'Vuelve a autorizar la cuenta de Google.',
                    403: 'Google rechazó el permiso, la cuota o la API no está habilitada.',
                    404: 'El archivo o calendario no está disponible.',
                    409: 'El recurso ya existe. Reintenta para recuperarlo.',
                    429: 'Google alcanzó su límite de solicitudes. Intenta más tarde.'}
        exc = HTTPException(502, messages.get(error.code, 'Google no pudo completar la operación.'))
        exc.google_status = error.code
        raise exc from None
    except (URLError, TimeoutError, OSError, ValueError):
        raise HTTPException(502, 'No se pudo comunicar con Google. Comprueba la conexión antes de reintentar.') from None


def trash_folder(folder_id):
    """Recoverable compensation, only for a folder created by this request."""
    google_request(f'https://www.googleapis.com/drive/v3/files/{quote(folder_id, safe="")}',
                   'PATCH', {'trashed': True})


def upload_cv(code, name, filename, mime, content):
    # New folders in My Drive are private by default; no permissions API is called.
    folder = google_request('https://www.googleapis.com/drive/v3/files?fields=id', 'POST', {
        'name': f'{name[:100]} - {code}', 'mimeType': 'application/vnd.google-apps.folder',
        'appProperties': {'postulacion': code},
    })
    folder_id = folder['id']
    boundary = uuid.uuid4().hex
    metadata = {'name': filename, 'parents': [folder_id], 'appProperties': {'postulacion': code}}
    body = (f'--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'.encode()
            + json.dumps(metadata).encode() + f'\r\n--{boundary}\r\nContent-Type: {mime}\r\n\r\n'.encode()
            + content + f'\r\n--{boundary}--\r\n'.encode())
    try:
        file = google_request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
                              'POST', raw=body, content_type=f'multipart/related; boundary={boundary}')
    except Exception:
        try:
            trash_folder(folder_id)
        except HTTPException:
            pass  # No success response; owner may need to remove an empty folder.
        raise
    return {'provider': 'drive', 'folder_id': folder_id, 'file_id': file['id'], 'mime': mime}


def download_cv(reference):
    return google_request(f'https://www.googleapis.com/drive/v3/files/{quote(reference["file_id"], safe="")}?alt=media', binary=True)


def calendar_event(record, start, duration):
    if start.tzinfo is None:
        raise HTTPException(422, 'La fecha debe incluir zona horaria.')
    if not 15 <= duration <= 180 or start <= datetime.now(timezone.utc):
        raise HTTPException(422, 'Selecciona una fecha futura y una duración entre 15 y 180 minutos.')
    zone = ZoneInfo('America/Santiago')
    start = start.astimezone(zone)
    end = (start.astimezone(timezone.utc) + timedelta(minutes=duration)).astimezone(zone)
    # One interview per application: stable ID makes retries/reprogramming idempotent.
    event_id = hashlib.sha256(('aquachile:' + record['codigo']).encode()).hexdigest()
    saved = record.get('calendar') or {}
    calendar_id = saved.get('calendar_id') or os.getenv('GOOGLE_CALENDAR_ID', 'primary')
    url = f'https://www.googleapis.com/calendar/v3/calendars/{quote(calendar_id, safe="")}/events'
    event = {'summary': f'Entrevista AquaChile - {record["codigo"]}',
             'description': 'Entrevista del proyecto académico. No incluye CV ni evaluación psicolaboral.',
             'visibility': 'private',
             'start': {'dateTime': start.isoformat(), 'timeZone': 'America/Santiago'},
             'end': {'dateTime': end.isoformat(), 'timeZone': 'America/Santiago'}}
    try:
        google_request(f'{url}/{event_id}')
    except HTTPException as error:
        if getattr(error, 'google_status', None) != 404:
            raise
        try:
            created = google_request(f'{url}?sendUpdates=none', 'POST', {**event, 'id': event_id})
        except HTTPException as conflict:
            if getattr(conflict, 'google_status', None) != 409:
                raise
            created = google_request(f'{url}/{event_id}?sendUpdates=none', 'PATCH', event)
    else:
        created = google_request(f'{url}/{event_id}?sendUpdates=none', 'PATCH', event)
    return {'event_id': created['id'], 'calendar_id': calendar_id,
            'inicio': start.isoformat(), 'fin': end.isoformat(), 'time_zone': 'America/Santiago'}
