import base64
import json
import os
import unittest
from unittest.mock import patch

from backend.api import email_service


RECORD = {
    "codigo": "AQ-20261123-ABC123",
    "nombre_completo": "Carlos Mendoza Silva",
    "email": "carlos.mendoza@correo.demo",
    "rut": "18.456.789-K",
    "cargo": "Operario de Centro de Cultivo",
    "familia_cargo": "Operativo",
    "centro_trabajo": "Centro Melinka 04",
    "localidad": "Melinka",
    "area": "Centro de cultivo",
    "turno": "14x14",
    "fecha_informe": "2026-11-30",
    "analista": "Benjamín Reclutador",
    "correo_analista": "aquachileduoc@gmail.com",
    "cv_nombre": "CV_Carlos.pdf",
}

CONFIG = ("re_test", "AquaChile <onboarding@resend.dev>")


class ResendNotificationTests(unittest.TestCase):
    def test_sin_api_key_no_intenta_enviar(self):
        with patch.dict(os.environ, {"RESEND_API_KEY": "", "RESEND_FROM": ""}):
            with patch.object(email_service, "_send_email") as send:
                result = email_service.send_application_notifications(RECORD, b"cv")

        self.assertEqual(result["estado"], "no_configurado")
        send.assert_not_called()

    def test_envia_candidato_y_analista_con_adjunto(self):
        with patch.dict(os.environ, {"RESEND_API_KEY": "re_test", "RESEND_FROM": CONFIG[1]}):
            with patch.object(email_service, "_send_email") as send:
                result = email_service.send_application_notifications(RECORD, b"contenido cv", "application/pdf")

        self.assertEqual(result["estado"], "enviado")
        self.assertTrue(result["candidato"])
        self.assertTrue(result["analista"])
        self.assertEqual(send.call_count, 2)

        candidate = send.call_args_list[0].args
        analyst = send.call_args_list[1].args
        self.assertEqual(candidate[1], RECORD["email"])
        self.assertIsNone(candidate[5])
        self.assertIn(RECORD["nombre_completo"], candidate[3])
        self.assertEqual(analyst[1], RECORD["correo_analista"])
        self.assertEqual(analyst[5], ("CV_Carlos.pdf", "application/pdf", b"contenido cv"))

    def test_payload_resend_incluye_adjunto_en_base64(self):
        with patch.dict(os.environ, {"RESEND_TIMEOUT_SECONDS": "10"}):
            with patch.object(email_service.urllib.request, "urlopen") as urlopen:
                email_service._send_email(
                    CONFIG,
                    "destino@demo.com",
                    "Asunto de prueba",
                    "<p>Hola</p>",
                    "Hola",
                    ("CV.pdf", "application/pdf", b"contenido cv"),
                )

        request = urlopen.call_args.args[0]
        payload = json.loads(request.data)
        self.assertEqual(request.get_header("Authorization"), "Bearer re_test")
        self.assertEqual(payload["from"], CONFIG[1])
        self.assertEqual(payload["to"], ["destino@demo.com"])
        self.assertEqual(payload["subject"], "Asunto de prueba")
        self.assertEqual(payload["attachments"][0]["filename"], "CV.pdf")
        self.assertEqual(payload["attachments"][0]["content_type"], "application/pdf")
        self.assertEqual(
            payload["attachments"][0]["content"],
            base64.b64encode(b"contenido cv").decode("ascii"),
        )


if __name__ == "__main__":
    unittest.main()
