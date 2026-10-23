import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout'

vi.mock('../components/Navbar', () => ({
  default: () => <header>Nav AquaChile</header>,
}))

vi.mock('../components/Footer', () => ({
  default: () => <footer>Footer AquaChile</footer>,
}))

vi.mock('../components/ChatWidget', () => ({
  default: () => <aside>Chat AquaChile</aside>,
}))

vi.mock('../hooks/useSmoothScroll', () => ({ default: () => {} }))

describe('AppLayout', () => {
  it('muestra los elementos compartidos y la página dentro de Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/prueba']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/prueba" element={<p>Contenido de prueba</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Nav AquaChile')).toBeInTheDocument()
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument()
    expect(screen.getByText('Footer AquaChile')).toBeInTheDocument()
    expect(screen.getByText('Chat AquaChile')).toBeInTheDocument()
  })
})
