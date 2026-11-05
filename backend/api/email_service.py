import logging
import mimetypes
import os
import smtplib
import ssl
from email.message import EmailMessage
from html import escape
from pathlib import Path


logger = logging.getLogger(__name__)
TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"


def _smtp_config():
    host = os.getenv("SMTP_HOST", "").strip()
    username = os.getenv("SMTP_USER", "").strip()
    # Google muestra las contraseñas de aplicación agrupadas; los espacios no forman parte de la clave.
    password = "".join(os.getenv("SMTP_PASSWORD", "").split())
    sender = os.getenv("SMTP_FROM", username).strip()
    if not all((host, username, password, sender)):
        return None
    try:
        port = int(os.getenv("SMTP_PORT", "587"))
        timeout = float(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))
    except ValueError:
        logger.warning("Configuración SMTP inválida: puerto o tiempo de espera no numérico")
        return None
    if not 1 <= port <= 65535 or timeout <= 0:
        logger.warning("Configuración SMTP inválida: puerto o tiempo de espera fuera de rango")
        return None
    security = os.getenv("SMTP_SECURITY", "starttls").strip().lower()
    if security not in {"starttls", "ssl"}:
        logger.warning("SMTP_SECURITY debe ser starttls o ssl")
        return None
    return host, port, username, password, sender, timeout, security


def _render_template(filename, values):
    content = (TEMPLATES_DIR / filename).read_text(encoding="utf-8")
    for key, value in values.items():
        content = content.replace("{{" + key + "}}", escape(str(value or ""), quote=True))
    return content


def _send_message(config, message):
    host, port, username, password, _sender, timeout, security = config
    context = ssl.create_default_context()
    if security == "ssl":
        with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as server:
            server.login(username, password)
            server.send_message(message)
    else:
        with smtplib.SMTP(host, port, timeout=timeout) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(username, password)
            server.send_message(message)


def _message(config, recipient, subject, html_body, text_body, attachment=None):
    message = EmailMessage()
    message["From"] = config[4]
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")
    if attachment:
        filename, content_type, content = attachment
        main_type, _, sub_type = content_type.partition("/")
        if not sub_type:
            main_type, sub_type = "application", "octet-stream"
        message.add_attachment(
            content,
            maintype=main_type,
            subtype=sub_type,
            filename=Path(filename).name,
        )
    return message


def send_application_notifications(record, cv_content, cv_content_type=None):
    """Send candidate confirmation and analyst notification independently."""
    config = _smtp_config()
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

    notifications = (
        (
            "candidato",
            record["email"],
            f"Postulación recibida · {record['codigo']}",
            "email_candidato.html",
            candidate_values,
            f"Hola {record['nombre_completo']}, recibimos tu postulación. Código: {record['codigo']}.",
            None,
        ),
        (
            "analista",
            record["correo_analista"],
            f"Nueva postulación · {record['codigo']}",
            "email_analista.html",
            analyst_values,
            f"Se recibió una postulación de {record['nombre_completo']}. Código: {record['codigo']}.",
            (record["cv_nombre"], cv_content_type or "application/octet-stream", cv_content),
        ),
    )

    sent = {"candidato": False, "analista": False}
    for key, recipient, subject, template, values, text_body, attachment in notifications:
        try:
            html_body = _render_template(template, values)
            message = _message(config, recipient, subject, html_body, text_body, attachment)
            _send_message(config, message)
            sent[key] = True
        except (OSError, smtplib.SMTPException, ValueError) as error:
            logger.warning("No se pudo enviar la notificación de %s: %s", key, error)

    if all(sent.values()):
        status = "enviado"
    elif any(sent.values()):
        status = "parcial"
    else:
        status = "fallido"
    return {"estado": status, **sent}
