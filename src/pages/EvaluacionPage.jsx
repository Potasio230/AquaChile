import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../services/api'

const states = [
  ['POSTULADO', 'Postulado'], ['EN_REVISION', 'En revisión'], ['CITADO', 'Citado'],
  ['EVALUADO', 'Evaluado'], ['APTO', 'Apto'], ['NO_APTO', 'No apto'], ['CANCELADO', 'Cancelado'],
]

function EvaluacionPage() {
  const { id } = useParams()
  const [application, setApplication] = useState(null)
  const [form, setForm] = useState({ estado: 'EN_REVISION', resultado: '', nota_evaluacion: '' })
  const [status, setStatus] = useState({ type: 'loading', message: 'Cargando ficha…' })

  useEffect(() => {
    api.getApplication(id)
      .then((record) => {
        setApplication(record)
        setForm({ estado: record.estado, resultado: record.resultado || '', nota_evaluacion: record.nota_evaluacion || '' })
        setStatus({ type: 'idle', message: '' })
      })
      .catch((error) => setStatus({ type: 'error', message: error.message }))
  }, [id])

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'loading', message: 'Guardando evaluación…' })
    try {
      await api.updateEvaluation(id, form)
      setApplication({ ...application, ...form })
      setStatus({ type: 'success', message: 'Evaluación guardada correctamente.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    }
  }

  return (
    <section className="internal-page evaluation-page">
      <div className="management-shell narrow-shell">
        <Link className="back-link" to="/gestion">← Volver a la bandeja</Link>
        {status.type === 'error' && !application && <div className="form-status error">{status.message}</div>}
        {application && (
          <>
            <div className="management-heading compact-heading">
              <div><span className="section-kicker">Ficha {application.codigo}</span><h1>{application.nombre_completo}</h1><p>{application.cargo} · {application.centro_trabajo}</p></div>
            </div>
            <div className="detail-grid">
              <article className="candidate-card">
                <h2>Antecedentes del candidato</h2>
                <dl>
                  <div><dt>RUT</dt><dd>{application.rut}</dd></div>
                  <div><dt>Contacto</dt><dd>{application.email}<br />{application.telefono || 'Sin teléfono'}</dd></div>
                  <div><dt>Localidad y turno</dt><dd>{application.localidad} · {application.turno}</dd></div>
                  <div><dt>Analista</dt><dd>{application.analista}<br />{application.correo_analista}</dd></div>
                  <div><dt>Fecha requerida</dt><dd>{application.fecha_informe}</dd></div>
                  <div><dt>Currículum</dt><dd>{application.cv_nombre}</dd></div>
                </dl>
                {application.observaciones && <div className="candidate-notes"><strong>Observaciones de la solicitud</strong><p>{application.observaciones}</p></div>}
              </article>
              <form className="evaluation-card" onSubmit={submit}>
                <h2>Registrar evaluación</h2>
                <label className="field"><span>Estado del proceso</span><select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>{states.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label className="field"><span>Resultado o recomendación</span><input value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} placeholder="Ej.: Recomendado con observaciones" /></label>
                <label className="field"><span>Informe / notas del psicólogo</span><textarea rows="9" value={form.nota_evaluacion} onChange={(e) => setForm({ ...form, nota_evaluacion: e.target.value })} placeholder="Registra aquí la síntesis de la entrevista…" /></label>
                {status.message && <div className={`form-status ${status.type}`}>{status.message}</div>}
                <button className="submit-button" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Guardando…' : 'Guardar evaluación'}</button>
              </form>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default EvaluacionPage

