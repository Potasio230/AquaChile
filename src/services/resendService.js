import { Resend } from "resend";
import { template } from "../../templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function enviarPostulacion() {
  const correoPrueba = process.env.CORREO_PRUEBA;
  if (!correoPrueba) {
    return { error: { message: "aquachileduoc@gmail.com" } };
  }

  const { data, error } = await resend.emails.send({
    from: "AquaChile <onboarding@resend.dev>",
    to: [correoPrueba],
    subject: "Confirmación de postulación - AquaChile",
    html: template,
  });

  if (error) return { error };
  return { data };
}
