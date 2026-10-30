import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormField from '../components/FormField'
import FormStatus from '../components/FormStatus'
import StatusBadge from '../components/StatusBadge'

describe('componentes reutilizables', () => {
  it('FormField utiliza props para mostrar etiqueta, ayuda y obligatoriedad', () => {
    render(<FormField label="Correo" name="correo" hint="Usa tu correo corporativo" required />)
    expect(screen.getByLabelText(/Correo/)).toBeRequired()
    expect(screen.getByText('Usa tu correo corporativo')).toBeVisible()
  })

  it('FormStatus representa estados de éxito y oculta mensajes vacíos', () => {
    const { rerender } = render(<FormStatus status={{ type: 'success', message: 'Guardado correctamente' }} />)
    expect(screen.getByRole('status')).toHaveClass('success')
    rerender(<FormStatus status={{ type: 'idle', message: '' }} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('StatusBadge transforma el estado técnico en una etiqueta comprensible', () => {
    render(<StatusBadge status="EN_REVISION" />)
    expect(screen.getByText('En revisión')).toHaveClass('status-en_revision')
  })
})

