import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import PublicLayout from './PublicLayout'

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

describe('PublicLayout', () => {
  it('muestra los elementos compartidos y la página dentro de Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/prueba']}>
        <Routes>
          <Route element={<PublicLayout />}>
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
