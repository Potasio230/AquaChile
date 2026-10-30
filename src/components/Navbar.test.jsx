import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Navbar from './Navbar'

function renderNavbar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Navbar />
      <Routes>
        <Route path="/" element={<h1>Inicio AquaChile</h1>} />
        <Route path="/postulacion" element={<h1>Formulario de postulación</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  it('renderiza los enlaces con las rutas de inicio y postulación', () => {
    renderNavbar()

    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Nueva evaluación' })).toHaveAttribute('href', '/postulacion')
    expect(screen.getByRole('link', { name: '¿Cómo funciona?' })).toHaveAttribute('href', '#proceso')
  })

  it('marca como activa la ruta actual', () => {
    renderNavbar('/postulacion')

    expect(screen.getByRole('link', { name: 'Nueva evaluación' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
  })

  it('navega al formulario al seleccionar Nueva evaluación', async () => {
    const user = userEvent.setup()
    renderNavbar()

    await user.click(screen.getByRole('link', { name: 'Nueva evaluación' }))

    expect(screen.getByRole('heading', { name: 'Formulario de postulación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nueva evaluación' })).toHaveAttribute('aria-current', 'page')
  })
})
