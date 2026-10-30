import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import PostulacionPage from '../pages/PostulacionPage'
import LoginPage from '../pages/LoginPage'
import ProtectedRoute from '../components/ProtectedRoute'
import { api } from '../services/api'

vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    createApplication: vi.fn(),
  },
}))

describe('páginas y navegación', () => {
  it('muestra el portal y un enlace hacia el formulario externo', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /decisiones más humanas/i })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Iniciar una solicitud' })).toHaveAttribute('href', '/postulacion')
  })

  it('protege el área interna y redirige al acceso cuando no existe sesión', () => {
    render(
      <MemoryRouter initialEntries={['/gestion']}>
        <Routes>
          <Route element={<ProtectedRoute />}><Route path="/gestion" element={<h1>Bandeja privada</h1>} /></Route>
          <Route path="/acceso-interno" element={<h1>Acceso interno</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Acceso interno' })).toBeVisible()
    expect(screen.queryByText('Bandeja privada')).not.toBeInTheDocument()
  })

  it('envía una postulación ficticia mediante una API simulada', async () => {
    api.createApplication.mockResolvedValue({ codigo: 'AQ-TEST-001' })
    const user = userEvent.setup()
    const { container } = render(<MemoryRouter><PostulacionPage /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /Candidato 1/ }))
    fireEvent.submit(container.querySelector('form'))
    await waitFor(() => expect(api.createApplication).toHaveBeenCalledOnce())
    expect(await screen.findByText(/AQ-TEST-001/)).toBeVisible()
  })

  it('inicia sesión con la API simulada y navega a la gestión interna', async () => {
    api.login.mockResolvedValue({ token: 'token-prueba', usuario: { nombre: 'Paula', rol: 'ADMIN' } })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/acceso-interno']}>
        <Routes>
          <Route path="/acceso-interno" element={<LoginPage />} />
          <Route path="/gestion" element={<h1>Bandeja de postulantes</h1>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Ingresar al sistema' }))
    expect(await screen.findByRole('heading', { name: 'Bandeja de postulantes' })).toBeVisible()
    expect(sessionStorage.getItem('aquachile-token')).toBe('token-prueba')
  })
})

