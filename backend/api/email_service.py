import base64
import json
import logging
import os
import urllib.error
import urllib.request
from html import escape
from pathlib import Path


logger = logging.getLogger(__name__)
TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"
RESEND_API_URL = "https://api.resend.com/emails"


def _config():
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    sender = os.getenv("RESEND_FROM", "AquaChile <onboarding@resend.dev>").strip()
    if not api_key or not sender:
        return None
    return api_key, sender


def _render_template(filename, values):
    content = (TEMPLATES_DIR / filename).read_text(encoding="utf-8")
    for key, value in values.items():
        content = content.replace("{{" + key + "}}", escape(str(value or ""), quote=True))
    return content


def _send_email(config, recipient, subject, html_body, text_body, attachment=None):
    """Envía un correo usando la API REST de Resend."""
    api_key, sender = config
    payload = {
        "from": sender,
        "to": [recipient],
        "subject": subject,
        "html": html_body,
        "text": text_body,
    }
    if attachment:
        filename, content_type, content = attachment
        payload["attachments"] = [{
            "filename": Path(filename).name,
            "content": base64.b64encode(content).decode("ascii"),
            "content_type": content_type or "application/octet-stream",
        }]

    request = urllib.request.Request(
        RESEND_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    timeout = float(os.getenv("RESEND_TIMEOUT_SECONDS", "10"))
    with urllib.request.urlopen(request, timeout=timeout) as response:
        response.read()


def send_application_notifications(record, cv_content, cv_content_type=None):
    """Send candidate confirmation and analyst notification independently."""
    config = _config()
    if not config:
        return {"estado": "no_configurado", "candidato": False, "analista": False}

    portal_url = os.getenv("PUBLIC_APP_URL", "http://localhost:5173").rstrip("/")
    dashboard_url = os.getenv("INTERNAL_APP_URL", "http://localhost:5173").rstrip("/")
    candidate_values = {
        "nombre": record["nombre_completo"],
        "codigo_solicitud": record["codigo"],
        "cargo": record["cargo"],
        "centro_trabajo": record["centro_trabajo"],
        "localidad": record["localidad"],
        "turno": record["turno"],
        "url_portal": portal_url,
    }
    analyst_values = {
        "analista": record["analista"],
        "nombre": record["nombre_completo"],
        "identificador": record["rut"],
        "cargo": record["cargo"],
        "area": record["area"],
        "familiaCargo": record["familia_cargo"],
        "centroTrabajo": record["centro_trabajo"],
        "localidad": record["localidad"],
        "turno": record["turno"],
        "fechaInforme": record["fecha_informe"],
        "url_dashboard": f"{dashboard_url}/gestion",
    }

    notifications = [
        (
            "candidato",
            record["email"],
            f"Postulación recibida · {record['codigo']}",
            "email_candidato.html",
            candidate_values,
            f"Hola {record['nombre_completo']}, recibimos tu postulación. Código: {record['codigo']}.",
            None,
        ),
    ]
    if record.get("correo_analista"):
        notifications.append(
            (
                "analista",
                record["correo_analista"],
                f"Nueva postulación · {record['codigo']}",
                "email_analista.html",
                analyst_values,
                f"Se recibió una postulación de {record['nombre_completo']}. Código: {record['codigo']}.",
                (record["cv_nombre"], cv_content_type or "application/octet-stream", cv_content),
            )
        )

    sent = {}
    for key, recipient, subject, template, values, text_body, attachment in notifications:
        try:
            _send_email(
                config,
                recipient,
                subject,
                _render_template(template, values),
                text_body,
                attachment,
            )
            sent[key] = True
        except (OSError, ValueError) as error:
            logger.warning("No se pudo enviar la notificación de %s: %s", key, error)

    if all(sent.values()):
        status = "enviado"
    elif any(sent.values()):
        status = "parcial"
    else:
        status = "fallido"
    return {"estado": status, **sent}
