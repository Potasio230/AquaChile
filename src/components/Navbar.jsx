import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../../assets/logo.png'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    let lastScrollTop = 0
    const onScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (scrollTop > lastScrollTop && scrollTop > 100) setNavHidden(true)
      else setNavHidden(false)
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const headerClasses = [
    'site-header',
    navHidden ? 'hidden' : '',
    !isHome ? 'solid' : '',
  ].filter(Boolean).join(' ')

  return (
    <header className={headerClasses}>
      <Link className="brand" to="/" aria-label="Ir al inicio">
        <img src={logo} alt="AquaChile" />
      </Link>
      <button
        className="menu-button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label="Abrir menú"
      >
        <span />
        <span />
        <span />
      </button>
      <nav className={menuOpen ? 'open' : ''} aria-label="Navegación principal">
        <Link to="/">Inicio</Link>
        {isHome ? (
          <a href="#proceso">Proceso</a>
        ) : (
          <Link to="/#proceso">Proceso</Link>
        )}
        <Link className="nav-cta" to="/postulacion">
          Nueva evaluación
        </Link>
        <Link to="/acceso-interno">Acceso interno</Link>
      </nav>
    </header>
  )
}

export default Navbar
