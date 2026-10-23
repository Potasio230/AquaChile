import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const statusLabels = {
  POSTULADO: 'Postulado', EN_REVISION: 'En revisión', CITADO: 'Citado',
  EVALUADO: 'Evaluado', APTO: 'Apto', NO_APTO: 'No apto', CANCELADO: 'Cancelado',
}

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
          <article><span>Total de solicitudes</span><strong>{summary.total}</strong></article>
          <article><span>Pendientes</span><strong>{summary.pendientes}</strong></article>
          <article><span>Evaluadas</span><strong>{summary.evaluados}</strong></article>
        </div>

        <div className="records-card">
          <div className="records-toolbar">
            <div>
              <h2>Bandeja de postulantes</h2>
              <p>Información registrada desde el formulario externo.</p>
            </div>
            <input aria-label="Buscar postulante" placeholder="Buscar por nombre, RUT, cargo…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          {status.message && <div className={`form-status ${status.type}`}>{status.message}</div>}
          {!status.message && filtered.length === 0 && <div className="empty-state">Aún no hay postulaciones para mostrar.</div>}
          {filtered.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead><tr><th>Código</th><th>Candidato</th><th>Cargo</th><th>Localidad</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.codigo}</strong></td>
                      <td>{item.nombre_completo}<small>{item.rut}</small></td>
                      <td>{item.cargo}<small>{item.centro_trabajo}</small></td>
                      <td>{item.localidad}</td>
                      <td><span className={`status-badge status-${item.estado.toLowerCase()}`}>{statusLabels[item.estado] || item.estado}</span></td>
                      <td><Link className="table-action" to={`/gestion/evaluacion/${item.id}`}>Revisar</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default GestionPage

