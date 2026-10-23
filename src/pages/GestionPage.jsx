import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import SummaryCard from '../components/SummaryCard'
import ApplicationTable from '../components/ApplicationTable'
import FormStatus from '../components/FormStatus'

function GestionPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState([])
  const [summary, setSummary] = useState({ total: 0, pendientes: 0, evaluados: 0 })
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState({ type: 'loading', message: 'Cargando postulaciones…' })
  const user = JSON.parse(sessionStorage.getItem('aquachile-user') || '{}')

  useEffect(() => {
    Promise.all([api.listApplications(), api.getSummary()])
      .then(([records, totals]) => {
        setApplications(records)
        setSummary(totals)
        setStatus({ type: 'idle', message: '' })
      })
      .catch((error) => setStatus({ type: 'error', message: error.message }))
  }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return applications
    return applications.filter((item) => [item.nombre_completo, item.rut, item.cargo, item.localidad, item.codigo]
      .some((value) => value?.toLowerCase().includes(search)))
  }, [applications, query])

  const logout = () => {
    sessionStorage.removeItem('aquachile-token')
    sessionStorage.removeItem('aquachile-user')
    navigate('/acceso-interno')
  }

  return (
    <section className="internal-page management-page">
      <div className="management-shell">
        <div className="management-heading">
          <div>
            <span className="section-kicker">Gestión interna</span>
            <h1>Evaluaciones psicolaborales</h1>
            <p>Hola, {user.nombre || 'equipo de selección'}. Aquí puedes revisar y gestionar las solicitudes recibidas.</p>
          </div>
          <button className="secondary-button" onClick={logout}>Cerrar sesión</button>
        </div>

        <div className="summary-grid">
          <SummaryCard label="Total de solicitudes" value={summary.total} />
          <SummaryCard label="Pendientes" value={summary.pendientes} />
          <SummaryCard label="Evaluadas" value={summary.evaluados} />
        </div>

        <div className="records-card">
          <div className="records-toolbar">
            <div>
              <h2>Bandeja de postulantes</h2>
              <p>Información registrada desde el formulario externo.</p>
            </div>
            <input aria-label="Buscar postulante" placeholder="Buscar por nombre, RUT, cargo…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <FormStatus status={status} />
          {!status.message && filtered.length === 0 && <div className="empty-state">Aún no hay postulaciones para mostrar.</div>}
          {filtered.length > 0 && <ApplicationTable applications={filtered} />}
        </div>
      </div>
    </section>
  )
}

export default GestionPage

