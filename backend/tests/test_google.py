import importlib
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch, MagicMock

from fastapi import HTTPException
from fastapi.testclient import TestClient
from backend.api import database, google_services as google
from backend.api.repository import SQLiteRepository, MongoRepository


def missing():
    error = HTTPException(502, 'missing')
    error.google_status = 404
    return error


class GoogleServiceTests(unittest.TestCase):
    def test_folder_and_upload_have_no_public_permission_or_original_cv_in_calendar(self):
        with patch.object(google, 'google_request', side_effect=[{'id': 'folder'}, {'id': 'file'}]) as call:
            ref = google.upload_cv('AQ-TEST', 'Candidato ficticio', 'cv.pdf', 'application/pdf', b'%PDF-test')
        self.assertEqual(ref['file_id'], 'file')
        self.assertEqual(ref['folder_id'], 'folder')
        self.assertEqual(call.call_args_list[0].args[2]['name'], 'Candidato ficticio - AQ-TEST')
        self.assertNotIn('permissions', str(call.call_args_list))
        self.assertIn(b'"parents": ["folder"]', call.call_args_list[1].kwargs['raw'])

    def test_failed_upload_trashes_only_new_folder(self):
        with patch.object(google, 'google_request', side_effect=[{'id': 'new-folder'}, HTTPException(502, 'error'), {}]) as call:
            with self.assertRaises(HTTPException):
                google.upload_cv('AQ-TEST', 'Ficticio', 'cv.pdf', 'application/pdf', b'x')
        self.assertIn('new-folder', call.call_args.args[0])
        self.assertEqual(call.call_args.args[2], {'trashed': True})

    def test_calendar_create_and_retry_use_same_event(self):
        start = datetime.now(timezone.utc) + timedelta(days=2)
        record = {'codigo': 'AQ-TEST'}
        with patch.object(google, 'google_request', side_effect=[missing(), {'id': 'created'}]) as call:
            google.calendar_event(record, start, 60)
        created_body = call.call_args.args[2]
        self.assertNotIn('attendees', created_body)
        self.assertEqual(created_body['visibility'], 'private')
        self.assertEqual(created_body['start']['timeZone'], 'America/Santiago')
        with patch.object(google, 'google_request', side_effect=[{'id': 'existing'}, {'id': 'existing'}]) as retry:
            google.calendar_event(record, start, 60)
        self.assertIn(created_body['id'], retry.call_args.args[0])
        self.assertEqual(retry.call_args.args[1], 'PATCH')

    def test_calendar_rejects_naive_past_and_invalid_duration(self):
        for start, duration in [(datetime.now(), 60), (datetime.now(timezone.utc)-timedelta(days=1), 60),
                                (datetime.now(timezone.utc)+timedelta(days=1), 0)]:
            with self.subTest(start=start, duration=duration), patch.object(google, 'google_request') as call:
                with self.assertRaises(HTTPException):
                    google.calendar_event({'codigo': 'AQ-TEST'}, start, duration)
                call.assert_not_called()

    def test_missing_credentials_gives_actionable_error(self):
        with patch.dict(os.environ, {'GOOGLE_TOKEN_FILE': '/nonexistent/google.json'}):
            with self.assertRaises(HTTPException) as error:
                google.access_token()
        self.assertEqual(error.exception.status_code, 503)

    def test_mongo_reads_legacy_gridfs_and_new_drive(self):
        repo = MongoRepository.__new__(MongoRepository)
        repo.db = MagicMock()
        repo.files = MagicMock()
        ident = '000000000000000000000001'
        repo.db.postulaciones.find_one.return_value = {'cv_drive': {'file_id': 'file', 'mime': 'application/pdf'}, 'cv_nombre': 'cv.pdf'}
        with patch.object(google, 'download_cv', return_value=b'drive'):
            self.assertEqual(repo.get_cv(ident)[2], b'drive')
        repo.db.postulaciones.find_one.return_value = {'cv_file_id': 'legacy', 'cv_nombre': 'old.pdf'}
        repo.files.get.return_value.read.return_value = b'old'
        self.assertEqual(repo.get_cv(ident)[2], b'old')


class GoogleAPITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_db = database.DB_PATH
        database.DB_PATH = Path(self.temp.name) / 'test.db'
        self.env = patch.dict(os.environ, {'AQUACHILE_DB_MODE': 'sqlite', 'CV_STORAGE': 'drive'})
        self.env.start()
        self.api = importlib.import_module('backend.api.app')
        self.repo_patch = patch.object(self.api, 'repository', SQLiteRepository())
        self.repo_patch.start()
        self.api.repository.initialize()
        self.api.TOKENS['test-admin'] = {'email': 'admin@example.test', 'rol': 'ADMIN'}
        self.api.TOKENS['test-public'] = {'email': 'candidate@example.test', 'rol': 'POSTULANTE'}
        self.client = TestClient(self.api.app)
        self.headers = {'Authorization': 'Bearer test-admin'}
        self.data = dict(nombre='Candidato ficticio', rut='11.111.111-1', email='test@example.test',
                         cargo='Operario', familia_cargo='Operaciones', centro_trabajo='Prueba',
                         localidad='Los Lagos', area='Prueba', turno='Dia', analista='Prueba',
                         correo_analista='analista@example.test', fecha_informe='2026-11-24')

    def tearDown(self):
        self.api.TOKENS.pop('test-admin', None)
        self.api.TOKENS.pop('test-public', None)
        self.client.close()
        self.repo_patch.stop()
        self.env.stop()
        database.DB_PATH = self.old_db
        self.temp.cleanup()

    def create_record(self):
        with patch.object(google, 'upload_cv', return_value={'provider': 'drive', 'file_id': 'file', 'folder_id': 'folder', 'mime': 'application/pdf'}), \
             patch.object(self.api, 'send_application_notifications', return_value={'estado': 'no_configurado'}):
            response = self.client.post('/api/postulaciones', data=self.data, files={'cv': ('cv.pdf', b'%PDF-1.4\nfixture', 'application/pdf')})
        self.assertEqual(response.status_code, 201)
        return response.json()['id']

    def test_full_flow_with_google_mocked_and_sqlite_persistent(self):
        ident = self.create_record()
        url = f'/api/postulaciones/{ident}'
        self.assertEqual(self.client.get(url).status_code, 401)
        self.assertEqual(self.client.get(url, headers={'Authorization': 'Bearer test-public'}).status_code, 403)
        record = self.client.get(url, headers=self.headers).json()
        self.assertEqual(record['cv_drive']['file_id'], 'file')
        with patch.object(google, 'download_cv', return_value=b'original'):
            self.assertEqual(self.client.get(url+'/cv', headers=self.headers).content, b'original')
        event = {'event_id': 'event', 'inicio': (datetime.now(timezone.utc)+timedelta(days=2)).isoformat(), 'calendar_id': 'primary'}
        with patch.object(google, 'calendar_event', return_value=event):
            response = self.client.post(url+'/entrevista', headers=self.headers, json={'inicio': event['inicio']})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(url, headers=self.headers).json()['calendar']['event_id'], 'event')

    def test_invalid_file_does_not_call_google(self):
        with patch.object(google, 'upload_cv') as upload:
            result = self.client.post('/api/postulaciones', data=self.data, files={'cv': ('fake.pdf', b'not pdf', 'application/pdf')})
        self.assertEqual(result.status_code, 400)
        upload.assert_not_called()

    def test_missing_google_authorization_does_not_create_application(self):
        with patch.object(google, 'upload_cv', side_effect=HTTPException(503, 'Autoriza Google')):
            result = self.client.post('/api/postulaciones', data=self.data, files={'cv': ('cv.pdf', b'%PDF-test', 'application/pdf')})
        self.assertEqual(result.status_code, 503)
        self.assertEqual(self.api.repository.list_applications(), [])

    def test_calendar_requires_internal_permission_and_existing_application(self):
        body = {'inicio': (datetime.now(timezone.utc)+timedelta(days=1)).isoformat()}
        for headers, expected in [({}, 401), ({'Authorization': 'Bearer test-public'}, 403), (self.headers, 404)]:
            self.assertEqual(self.client.post('/api/postulaciones/999/entrevista', headers=headers, json=body).status_code, expected)

if __name__ == '__main__':
    unittest.main()
