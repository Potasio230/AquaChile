import { useState } from 'react'

const initialForm = {
  nombre: '', identificador: '', cargo: '', centroTrabajo: '', localidad: '',
  analista: '', correoAnalista: '', familiaCargo: '', area: '', turno: '',
  fechaInforme: '', observaciones: '', cv: null,
}

const familias = ['Operativo', 'Técnico', 'Profesional', 'Supervisión o jefatura', 'Administrativo']
const areas = ['Centro de cultivo', 'Piscicultura', 'Planta de proceso', 'Mantención', 'Calidad', 'Logística', 'Administración', 'Otra']
const turnos = ['Jornada ordinaria', 'Sistema de turnos', '7x7', '10x10', '14x14', 'Otro']
const cargos = ['Operario de Centro de Cultivo', 'Operador de Pontón', 'Buzo Acuicultor', 'Técnico en Acuicultura', 'Jefe de Centro de Cultivo', 'Supervisor de Producción', 'Operario de Planta de Proceso', 'Operador de Sala de Despiece', 'Técnico en Mantención', 'Electricista', 'Mecánico', 'Analista de Calidad', 'Encargado de Logística', 'Administrativo']
const centros = ['Centro Melinka 04', 'Centro de Cultivo Punta Johnson', 'Centro de Cultivo Puqueldón', 'Piscicultura Calbuco', 'Piscicultura Río Pescado', 'Piscicultura Hollenberg', 'Planta de Proceso Puerto Montt', 'Planta de Proceso Natales', 'Oficina Corporativa Puerto Montt']
const localidades = ['Calbuco', 'Chiloé', 'Melinka', 'Puerto Aysén', 'Puerto Montt', 'Puerto Natales', 'Punta Arenas', 'Temuco', 'Valdivia']

function Field({ label, name, children, hint, ...props }) {
  return (
    <label className="field">
      <span>{label}{props.required && <b aria-hidden="true"> *</b>}</span>
      {children ?? <input name={name} {...props} />}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function PostulacionPage() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const update = ({ target }) => {
    const value = target.type === 'file' ? target.files?.[0] ?? null : target.value
    setForm((current) => ({ ...current, [target.name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (form.cv && form.cv instanceof File && (!allowedTypes.includes(form.cv.type) || form.cv.size > 10 * 1024 * 1024)) {
      setStatus({ type: 'error', message: 'El currículum debe ser PDF o Word y pesar como máximo 10 MB.' })
      return
    }
    setStatus({ type: 'loading', message: 'Enviando solicitud al servidor…' })

    try {
      const apiBackendUrl = 'http://127.0.0.1:8000/api/postulante/formulario'
      const payloadAgente = {
        rut: form.identificador,
        nombre_completo: form.nombre,
        email: 'benjita1b4@gmail.com',
        telefono: '+56 9 8765 4321',
        cargo_postula: form.cargo,
        familia_cargo: form.familiaCargo,
        respuestas_formulario: {
          centroTrabajo: form.centroTrabajo,
          localidad: form.localidad,
          area: form.area,
          turno: form.turno,
          analista: form.analista,
          correoAnalista: 'benjita1b4@gmail.com',
          fechaInforme: form.fechaInforme,
          observaciones: form.observaciones || ''
        },
        cv_texto: `CURRICULUM VITAE - ${form.nombre}\nCargo: ${form.cargo}\nTurno: ${form.turno}\nCentro: ${form.centroTrabajo}\nObservaciones: ${form.observaciones || 'Sin observaciones'}`
      }

      const res = await fetch(apiBackendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadAgente)
      })

      if (!res.ok) throw new Error(`El servidor respondió con estado ${res.status}`)

      setStatus({ type: 'success', message: 'El servidor recibió la solicitud.' })
      setForm(initialForm)
      event.currentTarget.reset()
    } catch (error) {
      console.error('Error al enviar la solicitud:', error)
      setStatus({ type: 'error', message: 'No se pudo enviar la solicitud. Revisa la conexión con el servidor e inténtalo nuevamente.' })
    }
  }

  return (
    <section className="form-section" id="formulario">
      <div className="form-heading">
        <span className="section-kicker">Nueva solicitud</span>
        <h2>Evaluación psicolaboral</h2>
        <p>Completa los campos obligatorios. Para las pruebas del proyecto, utiliza únicamente información ficticia.</p>

        <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', alignSelf: 'center', color: '#E0F2FE', fontWeight: 'bold', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>Autorellenar prueba:</span>
          <button
            type="button"
            style={{
              background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '4px',
              padding: '7px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
            }}
            onClick={() => {
              setForm({
                nombre: 'Carlos Mendoza Silva',
                identificador: '18.456.789-0',
                cargo: 'Operario de Centro de Cultivo',
                centroTrabajo: 'Centro Melinka 04',
                localidad: 'Melinka',
                analista: 'Benjamín Reclutador',
                correoAnalista: 'benjita1b4@gmail.com',
                familiaCargo: 'Operativo',
                area: 'Centro de cultivo',
                turno: '14x14',
                fechaInforme: '2026-10-15',
                observaciones: 'Experiencia previa de 3 años en pontón marítimo y alimentación de salmones.',
                cv: new File(['CV Carlos Mendoza - Operario Pontón'], 'CV_Carlos_Mendoza.pdf', { type: 'application/pdf' })
              })
            }}
          >
            Candidato 1 (Carlos · Operario 14x14)
          </button>
          <button
            type="button"
            style={{
              background: '#F28C28', color: 'white', border: 'none', borderRadius: '4px',
              padding: '7px 14px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
            }}
            onClick={() => {
              setForm({
                nombre: 'Camila Soto Navarrete',
                identificador: '16.782.341-K',
                cargo: 'Jefe de Centro de Cultivo',
                centroTrabajo: 'Piscicultura Calbuco',
                localidad: 'Calbuco',
                analista: 'Benjamín Reclutador',
                correoAnalista: 'benjita1b4@gmail.com',
                familiaCargo: 'Supervisión o jefatura',
                area: 'Piscicultura',
                turno: '14x14',
                fechaInforme: '2026-10-18',
                observaciones: 'Ingeniera en Acuicultura, 5 años liderando faenas de biomasa y estándares sanitarios.',
                cv: new File(['CV Camila Soto - Jefa de Centro'], 'CV_Camila_Soto.pdf', { type: 'application/pdf' })
              })
            }}
          >
            Candidato 2 (Camila · Jefa Centro)
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="evaluation-form">
        <fieldset>
          <legend><span>1</span> Datos del candidato</legend>
          <div className="form-grid">
            <Field label="Nombre completo" name="nombre" value={form.nombre} onChange={update} required />
            <Field label="RUT o identificador" name="identificador" value={form.identificador} onChange={update} required />
            <Field label="Cargo al que postula" required>
              <select name="cargo" value={form.cargo} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {cargos.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Instalación, planta o centro" required>
              <select name="centroTrabajo" value={form.centroTrabajo} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {centros.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Localidad" required>
              <select name="localidad" value={form.localidad} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {localidades.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset>
          <legend><span>2</span> Datos de la solicitud</legend>
          <div className="form-grid">
            <Field label="Nombre del analista" name="analista" value={form.analista} onChange={update} required />
            <Field label="Correo del analista" name="correoAnalista" type="email" value={form.correoAnalista} onChange={update} required />
            <Field label="Familia de cargo" required>
              <select name="familiaCargo" value={form.familiaCargo} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {familias.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Área" required>
              <select name="area" value={form.area} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {areas.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Sistema de turno" required>
              <select name="turno" value={form.turno} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {turnos.map((item) => <option key={item}>{item}</option>)}
              </select>
            </Field>
            <Field label="Fecha requerida para el informe" name="fechaInforme" type="date" value={form.fechaInforme} onChange={update} required />
          </div>
        </fieldset>

        <fieldset>
          <legend><span>3</span> Antecedentes adicionales</legend>
          <div className="form-grid">
            <Field label="Observaciones" hint="No incluyas información sensible que no sea necesaria.">
              <textarea name="observaciones" value={form.observaciones} onChange={update} rows="4" />
            </Field>
            <Field label="Currículum del candidato" required hint="Formato PDF o Word. Máximo 10 MB.">
              <input name="cv" type="file" accept=".pdf,.doc,.docx" onChange={update} required />
            </Field>
          </div>
        </fieldset>

        {status.message && <div className={`form-status ${status.type}`} role="status">{status.message}</div>}
        <div className="form-actions">
          <p><b>*</b> Campos obligatorios</p>
          <button className="submit-button" type="submit" disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default PostulacionPage
