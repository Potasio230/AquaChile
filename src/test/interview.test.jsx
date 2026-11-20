import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InterviewScheduler from '../components/InterviewScheduler'
import { agendarCita } from '../services/googleCalendarService'

vi.mock('../services/googleCalendarService', () => ({ agendarCita: vi.fn() }))
beforeEach(() => vi.resetAllMocks())

describe('agenda de entrevistas', () => {
  it('envía la cita y permite reprogramar', async () => {
    agendarCita.mockResolvedValue({ calendar: { inicio: '2099-11-24T15:00:00-03:00' } })
    const user = userEvent.setup()
    render(<InterviewScheduler applicationId="test-id" />)
    fireEvent.change(screen.getByLabelText(/Fecha y hora de entrevista/), { target: { value: '2099-11-24T15:00' } })
    await user.click(screen.getByRole('button', { name: 'Agendar en Google Calendar' }))
    expect(await screen.findByText(/No se enviaron invitaciones/)).toBeVisible()
    expect(agendarCita).toHaveBeenCalledWith('test-id', new Date('2099-11-24T15:00').toISOString(), '60')
    expect(screen.getByRole('button', { name: 'Reprogramar entrevista' })).toBeEnabled()
  })
  it('muestra un error de Google sin fingir éxito', async () => {
    agendarCita.mockRejectedValue(new Error('Autoriza Google'))
    const user = userEvent.setup()
    render(<InterviewScheduler applicationId="test-id" />)
    fireEvent.change(screen.getByLabelText(/Fecha y hora de entrevista/), { target: { value: '2099-11-24T15:00' } })
    await user.click(screen.getByRole('button', { name: 'Agendar en Google Calendar' }))
    expect(await screen.findByText('Autoriza Google')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Agendar en Google Calendar' })).toBeEnabled()
  })
  it('rechaza fechas pasadas antes de llamar a la API', () => {
    const { container } = render(<InterviewScheduler applicationId="test-id" />)
    fireEvent.change(screen.getByLabelText(/Fecha y hora de entrevista/), { target: { value: '2020-01-01T10:00' } })
    fireEvent.submit(container.querySelector('form'))
    expect(screen.getByText('Selecciona una fecha y hora futuras.')).toBeVisible()
    expect(agendarCita).not.toHaveBeenCalled()
  })
})
