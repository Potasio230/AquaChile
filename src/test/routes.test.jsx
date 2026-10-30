import { expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

vi.mock('../hooks/useSmoothScroll', () => ({ default: () => {} }))
vi.mock('../components/ChatWidget', () => ({ default: () => null }))

it('muestra la página 404 dentro del portal para una dirección inexistente', () => {
  window.history.replaceState({}, '', '/pagina-inexistente')
  render(<App />)
  expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
})

it('mantiene la evaluación interna protegida al combinar las rutas públicas', () => {
  window.history.replaceState({}, '', '/gestion/evaluacion/prueba')
  render(<App />)
  expect(screen.getByRole('button', { name: 'Ingresar al sistema' })).toBeVisible()
  expect(window.location.pathname).toBe('/acceso-interno')
})
