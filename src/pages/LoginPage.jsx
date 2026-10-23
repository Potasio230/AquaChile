import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [credentials, setCredentials] = useState({ email: 'rrhh@aquachile.demo', clave: 'AquaChile2026' })
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'loading', message: 'Ingresando…' })
    try {
      const data = await api.login(credentials)
      sessionStorage.setItem('aquachile-token', data.token)
      sessionStorage.setItem('aquachile-user', JSON.stringify(data.usuario))
      navigate(location.state?.from || '/gestion', { replace: true })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <section className="internal-page login-page">
      <div className="login-card">
        <span className="section-kicker">Acceso interno</span>
        <h1>Gestión de evaluaciones</h1>
        <p>Ingreso exclusivo para el equipo de Reclutamiento y psicólogos evaluadores.</p>
        <form onSubmit={submit}>
          <label className="field">
            <span>Correo corporativo</span>
            <input type="email" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} required />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input type="password" value={credentials.clave} onChange={(event) => setCredentials({ ...credentials, clave: event.target.value })} required />
          </label>
          {status.message && <div className={`form-status ${status.type}`} role="status">{status.message}</div>}
          <button className="submit-button full-button" disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Ingresando…' : 'Ingresar al sistema'}
          </button>
        </form>
        <small>Acceso de demostración incluido para la presentación académica.</small>
      </div>
    </section>
  )
}

export default LoginPage

