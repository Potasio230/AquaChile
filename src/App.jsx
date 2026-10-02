import { useState } from 'react'
import logo from '../assets/logo.png'
import heroPoster from '../assets/Cultivos.jpg'
import heroVideo from '../assets/BackgroundAquaChile.mp4'
import salmon from '../assets/Salmón.png'

const initialForm = {
  nombre: '', identificador: '', cargo: '', centroTrabajo: '', localidad: '',
  analista: '', correoAnalista: '', familiaCargo: '', area: '', turno: '',
  fechaInforme: '', observaciones: '', cv: null,
}

const familias = ['Operativo', 'Técnico', 'Profesional', 'Supervisión o jefatura', 'Administrativo']
const areas = ['Centro de cultivo', 'Piscicultura', 'Planta de proceso', 'Mantención', 'Calidad', 'Logística', 'Administración', 'Otra']
const turnos = ['Jornada ordinaria', 'Sistema de turnos', '7x7', '10x10', '14x14', 'Otro']
const cargos = [
  'Operario/a de planta', 'Técnico/a de mantención', 'Técnico/a acuícola',
  'Asistente de centro de cultivo', 'Analista de calidad', 'Analista de laboratorio',
  'Profesional de prevención de riesgos', 'Encargado/a de logística',
  'Supervisor/a de producción', 'Jefe/a de turno', 'Cargo administrativo', 'Otro cargo',
]
const instalaciones = [
  'Centro de cultivo', 'Piscicultura', 'Planta de proceso', 'Centro de distribución',
  'Oficina administrativa', 'Otra instalación',
]
const regiones = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana de Santiago', "Libertador General Bernardo O’Higgins",
  'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo', 'Magallanes y de la Antártica Chilena',
]

function Field({ label, name, children, hint, ...props }) {
  return (
    <label className="field">
      <span>{label}{props.required && <b aria-hidden="true"> *</b>}</span>
      {children ?? <input name={name} {...props} />}
      {hint && <small>{hint}</small>}
    </label>
  )
}

const initialApplication = {
  nombre: '', identificador: '', correo: '', telefono: '', cargo: '',
  centroTrabajo: '', localidad: '', consentimiento: false, cv: null,
}

function ExternalApplicationForm() {
  const [application, setApplication] = useState(initialApplication)
  const [applicationStatus, setApplicationStatus] = useState({ type: 'idle', message: '' })

  const updateApplication = ({ target }) => {
    const value = target.type === 'file'
      ? target.files?.[0] ?? null
      : target.type === 'checkbox' ? target.checked : target.value
    setApplication((current) => ({ ...current, [target.name]: value }))
  }

  const submitApplication = async (event) => {
    event.preventDefault()
    if (application.cv?.size > 10 * 1024 * 1024) {
      setApplicationStatus({ type: 'error', message: 'El currículum no puede superar los 10 MB.' })
      return
    }
    setApplicationStatus({ type: 'loading', message: 'Enviando postulación…' })
    const payload = new FormData()
    Object.entries(application).forEach(([key, value]) => value !== null && payload.append(key, value))

    try {
      const evaluationUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/evaluaciones'
      const apiUrl = evaluationUrl.replace(/\/evaluaciones\/?$/, '/postulaciones')
      const response = await fetch(apiUrl, { method: 'POST', body: payload })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'La API rechazó la postulación')
      setApplicationStatus({ type: 'success', message: `${result.mensaje} Código: ${result.solicitud.id.slice(0, 8)}.` })
      setApplication(initialApplication)
      event.currentTarget.reset()
    } catch (error) {
      const message = error instanceof TypeError
        ? 'No se pudo conectar con el servidor. Ejecuta “npm run dev:all”.'
        : error.message
      setApplicationStatus({ type: 'error', message })
    }
  }

  return (
    <section className="form-section external-section" id="postulacion">
      <div className="form-heading">
        <span className="section-kicker">Portal de candidatos</span>
        <h2>Postula a AquaChile</h2>
        <p>Ingresa tus antecedentes y adjunta tu currículum. Esta información será revisada por el equipo de Reclutamiento y Selección.</p>
      </div>
      <form onSubmit={submitApplication} className="evaluation-form">
        <fieldset>
          <legend><span>1</span> Información personal</legend>
          <div className="form-grid">
            <Field label="Nombre completo" name="nombre" value={application.nombre} onChange={updateApplication} required />
            <Field label="RUT o identificador" name="identificador" value={application.identificador} onChange={updateApplication} required />
            <Field label="Correo electrónico" name="correo" type="email" value={application.correo} onChange={updateApplication} required />
            <Field label="Teléfono" name="telefono" type="tel" value={application.telefono} onChange={updateApplication} required />
          </div>
        </fieldset>
        <fieldset>
          <legend><span>2</span> Preferencias de postulación</legend>
          <div className="form-grid">
            <Field label="Cargo al que postula" required><select name="cargo" value={application.cargo} onChange={updateApplication} required><option value="">Selecciona un cargo</option>{cargos.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Tipo de instalación" required><select name="centroTrabajo" value={application.centroTrabajo} onChange={updateApplication} required><option value="">Selecciona una instalación</option>{instalaciones.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Región" required><select name="localidad" value={application.localidad} onChange={updateApplication} required><option value="">Selecciona una región</option>{regiones.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="Currículum" required hint="PDF o Word, máximo 10 MB."><input name="cv" type="file" accept=".pdf,.doc,.docx" onChange={updateApplication} required /></Field>
          </div>
        </fieldset>
        <label className="consent-field">
          <input name="consentimiento" type="checkbox" checked={application.consentimiento} onChange={updateApplication} required />
          <span>Acepto que mis datos sean utilizados exclusivamente para este proceso de selección.</span>
        </label>
        {applicationStatus.message && <div className={`form-status ${applicationStatus.type}`} role="status">{applicationStatus.message}</div>}
        <div className="form-actions">
          <p><b>*</b> Campos obligatorios</p>
          <button className="submit-button" type="submit" disabled={applicationStatus.type === 'loading'}>{applicationStatus.type === 'loading' ? 'Enviando…' : 'Enviar postulación'}</button>
        </div>
      </form>
    </section>
  )
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [menuOpen, setMenuOpen] = useState(false)
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
    if (form.cv && (!allowedTypes.includes(form.cv.type) || form.cv.size > 10 * 1024 * 1024)) {
      setStatus({ type: 'error', message: 'El currículum debe ser PDF o Word y pesar como máximo 10 MB.' })
      return
    }
    setStatus({ type: 'loading', message: 'Enviando solicitud…' })
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => value !== null && payload.append(key, value))

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/evaluaciones'
      const response = await fetch(apiUrl, { method: 'POST', body: payload })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'La API rechazó la solicitud')
      setStatus({
        type: 'success',
        message: `${result.mensaje} Código: ${result.solicitud.id.slice(0, 8)}.`,
      })
      setForm(initialForm)
      event.currentTarget.reset()
    } catch (error) {
      const connectionMessage = error instanceof TypeError
        ? 'No se pudo conectar con el servidor. Ejecuta “npm run dev:all” e inténtalo nuevamente.'
        : error.message
      setStatus({ type: 'error', message: `No fue posible enviar la solicitud: ${connectionMessage}` })
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Ir al inicio"><img src={logo} alt="AquaChile" /></a>
        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Abrir menú"><span /><span /><span /></button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Navegación principal">
          <a href="#inicio">Inicio</a><a href="#postulacion">Postular</a><a className="nav-cta" href="#formulario-interno">Acceso interno</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio">
          <video autoPlay loop muted playsInline poster={heroPoster}><source src={heroVideo} type="video/mp4" /></video>
          <div className="hero-overlay" />
          <div className="hero-content">
            <span className="eyebrow">Personas · Tecnología · Futuro</span>
            <h1>Evaluaciones más ágiles, decisiones más humanas.</h1>
            <p>Centralizamos la solicitud de evaluaciones psicolaborales para acompañar cada proceso con precisión, seguridad y cercanía.</p>
            <a className="primary-button" href="#postulacion">Postular ahora</a>
          </div>
          <a className="scroll-indicator" href="#proceso" aria-label="Continuar al contenido">⌄</a>
        </section>

        <section className="process-section" id="proceso">
          <div className="salmon-visual"><img src={salmon} alt="Salmón AquaChile" /></div>
          <div className="process-copy">
            <span className="section-kicker">Un proceso conectado</span>
            <h2>La información correcta, desde el primer paso.</h2>
            <p>Esta solicitud reúne los antecedentes necesarios para preparar la evaluación y activar el flujo automatizado del equipo de Reclutamiento y Selección.</p>
            <div className="steps">
              <div><strong>01</strong><span>Completa los antecedentes</span></div>
              <div><strong>02</strong><span>Adjunta el currículum</span></div>
              <div><strong>03</strong><span>Envía la solicitud</span></div>
            </div>
          </div>
        </section>

        <ExternalApplicationForm />

        <section className="form-section internal-section" id="formulario-interno">
          <div className="form-heading">
            <span className="section-kicker">Uso interno · Reclutamiento y Selección</span>
            <h2>Evaluación psicolaboral</h2>
            <p>Completa los campos obligatorios. Para las pruebas del proyecto, utiliza únicamente información ficticia.</p>
          </div>

          <form onSubmit={handleSubmit} className="evaluation-form">
            <fieldset>
              <legend><span>1</span> Datos del candidato</legend>
              <div className="form-grid">
                <Field label="Nombre completo" name="nombre" value={form.nombre} onChange={update} required />
                <Field label="RUT o identificador" name="identificador" value={form.identificador} onChange={update} required />
                <Field label="Cargo al que postula" required><select name="cargo" value={form.cargo} onChange={update} required><option value="">Selecciona un cargo</option>{cargos.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Instalación, planta o centro" required><select name="centroTrabajo" value={form.centroTrabajo} onChange={update} required><option value="">Selecciona una instalación</option>{instalaciones.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Región" required><select name="localidad" value={form.localidad} onChange={update} required><option value="">Selecciona una región</option>{regiones.map((item) => <option key={item}>{item}</option>)}</select></Field>
              </div>
            </fieldset>

            <fieldset>
              <legend><span>2</span> Datos de la solicitud</legend>
              <div className="form-grid">
                <Field label="Nombre del analista" name="analista" value={form.analista} onChange={update} required />
                <Field label="Correo del analista" name="correoAnalista" type="email" value={form.correoAnalista} onChange={update} required />
                <Field label="Familia de cargo" required><select name="familiaCargo" value={form.familiaCargo} onChange={update} required><option value="">Selecciona una opción</option>{familias.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Área" required><select name="area" value={form.area} onChange={update} required><option value="">Selecciona una opción</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Sistema de turno" required><select name="turno" value={form.turno} onChange={update} required><option value="">Selecciona una opción</option>{turnos.map((item) => <option key={item}>{item}</option>)}</select></Field>
                <Field label="Fecha requerida para el informe" name="fechaInforme" type="date" value={form.fechaInforme} onChange={update} required />
              </div>
            </fieldset>

            <fieldset>
              <legend><span>3</span> Antecedentes adicionales</legend>
              <div className="form-grid">
                <Field label="Observaciones" hint="No incluyas información sensible que no sea necesaria."><textarea name="observaciones" value={form.observaciones} onChange={update} rows="4" /></Field>
                <Field label="Currículum del candidato" required hint="Formato PDF o Word. Máximo 10 MB."><input name="cv" type="file" accept=".pdf,.doc,.docx" onChange={update} required /></Field>
              </div>
            </fieldset>

            {status.message && <div className={`form-status ${status.type}`} role="status">{status.message}</div>}
            <div className="form-actions">
              <p><b>*</b> Campos obligatorios</p>
              <button className="submit-button" type="submit" disabled={status.type === 'loading'}>{status.type === 'loading' ? 'Enviando…' : 'Enviar solicitud'}</button>
            </div>
          </form>
        </section>
      </main>

      <footer><img src={logo} alt="AquaChile" /><p>Proyecto académico de automatización psicolaboral · 2026</p></footer>
    </>
  )
}

export default App
