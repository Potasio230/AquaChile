import { request } from './api'

export async function agendarCita(postulacionId, inicio, duracionMinutos) {
  return request(`/postulaciones/${encodeURIComponent(postulacionId)}/entrevista`, {
    method: 'POST',
    body: JSON.stringify({ inicio, duracion_minutos: Number(duracionMinutos) }),
  })
}
