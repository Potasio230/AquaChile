import { useState } from 'react'
import FormField from './FormField'
import FormStatus from './FormStatus'
import { agendarCita } from '../services/googleCalendarService'

export default function InterviewScheduler({ applicationId, calendar }) {
  const [inicio, setInicio] = useState('')
  const [duration, setDuration] = useState('60')
  const [saved, setSaved] = useState(calendar)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const busy = status.type === 'loading'

  async function submit(event) {
    event.preventDefault()
    const date = new Date(inicio)
    if (!inicio || Number.isNaN(date.getTime()) || date <= new Date()) {
      setStatus({ type: 'error', message: 'Selecciona una fecha y hora futuras.' })
      return
    }
    setStatus({ type: 'loading', message: 'Guardando cita en Google Calendar…' })
    try {
      const response = await agendarCita(applicationId, date.toISOString(), duration)
      setSaved(response.calendar)
      setStatus({ type: 'success', message: 'Entrevista guardada en Google Calendar. No se enviaron invitaciones.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <form className="evaluation-card" onSubmit={submit}>
      <h2>Agendar entrevista</h2>
      <p>Una cita privada por postulación. Si vuelves a guardar, se reprograma la misma cita. No se adjunta el CV ni se invita automáticamente al candidato.</p>
      {saved && <p role="status">Cita actual: {new Date(saved.inicio).toLocaleString('es-CL', { timeZone: 'America/Santiago' })} (Chile).</p>}
      <FormField label="Fecha y hora de entrevista" type="datetime-local" required value={inicio} onChange={(e) => setInicio(e.target.value)} disabled={busy} hint={`Horario de tu dispositivo: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`} />
      <FormField label="Duración en minutos" type="number" min="15" max="180" required value={duration} onChange={(e) => setDuration(e.target.value)} disabled={busy} />
      <FormStatus status={status} />
      <button className="submit-button" disabled={busy}>{busy ? 'Guardando cita…' : saved ? 'Reprogramar entrevista' : 'Agendar en Google Calendar'}</button>
    </form>
  )
}
