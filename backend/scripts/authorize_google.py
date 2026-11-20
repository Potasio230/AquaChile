"""Run locally once; never put a Gmail password in the application."""
import argparse
import os
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/calendar.events']

def main():
    parser = argparse.ArgumentParser(description='Autorizar Drive y Calendar con una cuenta de prueba.')
    parser.add_argument('--client', required=True, help='JSON OAuth de tipo aplicación de escritorio')
    parser.add_argument('--output', default='.secrets/google-token.json')
    args = parser.parse_args()
    destination = Path(args.output)
    if destination.exists():
        parser.error('El archivo de token ya existe. Usa otro --output para no sobrescribirlo.')
    credentials = InstalledAppFlow.from_client_secrets_file(args.client, SCOPES).run_local_server(
        port=0, access_type='offline', prompt='consent', authorization_prompt_message='Autoriza en el navegador la cuenta de prueba.',
        success_message='Autorización completada. Puedes cerrar esta ventana.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as token_file:
        token_file.write(credentials.to_json())
    print('Autorización guardada en archivo privado. Reinicia el backend.')

if __name__ == '__main__':
    main()
