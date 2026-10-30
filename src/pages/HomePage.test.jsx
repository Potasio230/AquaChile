import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

// Los assets binarios (video, imágenes) no existen en el entorno de test,
// se reemplazan por strings vacíos para evitar errores de importación.
vi.mock('../../assets/Cultivos.jpg', () => ({ default: '' }))
vi.mock('../../assets/BackgroundAquaChile.mp4', () => ({ default: '' }))
vi.mock('../../assets/Salmón.png', () => ({ default: '' }))

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('muestra el titular principal del hero', () => {
    renderHomePage()
    expect(
      screen.getByRole('heading', { level: 1, name: /evaluaciones más ágiles/i }),
    ).toBeInTheDocument()
  })

  it('muestra el enlace para iniciar una solicitud apuntando a /postulacion', () => {
    renderHomePage()
    const cta = screen.getByRole('link', { name: /iniciar una solicitud/i })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/postulacion')
  })

  it('muestra el indicador de scroll hacia la sección proceso', () => {
    renderHomePage()
    expect(screen.getByRole('link', { name: /continuar al contenido/i })).toHaveAttribute(
      'href',
      '#proceso',
    )
  })

  it('muestra el título y el párrafo de la sección ¿Cómo funciona?', () => {
    renderHomePage()
    expect(
      screen.getByRole('heading', { level: 2, name: /la información correcta/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/reúne los antecedentes necesarios/i)).toBeInTheDocument()
  })

  it('muestra la imagen del salmón con su alt text', () => {
    renderHomePage()
    expect(screen.getByAltText(/salmón aquachile/i)).toBeInTheDocument()
  })
})
