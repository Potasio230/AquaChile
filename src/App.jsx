import { useEffect, useState } from 'react'
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

function Field({ label, name, children, hint, ...props }) {
  return (
    <label className="field">
      <span>{label}{props.required && <b aria-hidden="true"> *</b>}</span>
      {children ?? <input name={name} {...props} />}
      {hint && <small>{hint}</small>}
    </label>
  )
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [menuOpen, setMenuOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

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
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(apiUrl, { method: 'POST', body: payload })
        if (!response.ok) throw new Error('La API rechazó la solicitud')
        setStatus({ type: 'success', message: 'Solicitud enviada correctamente.' })
      } else {
        const record = { ...form, cv: form.cv?.name ?? '', fechaRegistro: new Date().toISOString() }
        const records = JSON.parse(localStorage.getItem('aquachile-solicitudes') ?? '[]')
        localStorage.setItem('aquachile-solicitudes', JSON.stringify([...records, record]))
        setStatus({ type: 'success', message: 'Prueba completada. Los datos se guardaron localmente en este navegador.' })
      }
      setForm(initialForm)
      event.currentTarget.reset()
    } catch (error) {
      setStatus({ type: 'error', message: `No fue posible enviar la solicitud: ${error.message}` })
    }
  }

  return (
    <>
      <header className={navHidden ? 'site-header hidden' : 'site-header'}>
        <a className="brand" href="#inicio" aria-label="Ir al inicio"><img src={logo} alt="AquaChile" /></a>
        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Abrir menú"><span /><span /><span /></button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Navegación principal">
          <a href="#inicio">Inicio</a><a href="#proceso">Proceso</a><a className="nav-cta" href="#formulario">Nueva evaluación</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="inicio">
          <video autoPlay loop muted playsInline poster={heroPoster}><source src={heroVideo} type="video/mp4" /></video>
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1>Evaluaciones más ágiles, decisiones más humanas.</h1>
            <p>Centralizamos la solicitud de evaluaciones psicolaborales para acompañar cada proceso con precisión, seguridad y cercanía.</p>
            <a className="primary-button" href="#formulario">Iniciar una solicitud</a>
          </div>
          <a className="scroll-indicator" href="#proceso" aria-label="Continuar al contenido">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </a>
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

        <section className="form-section" id="formulario">
          <div className="form-heading">
            <span className="section-kicker">Nueva solicitud</span>
            <h2>Evaluación psicolaboral</h2>
            <p>Completa los campos obligatorios. Para las pruebas del proyecto, utiliza únicamente información ficticia.</p>
          </div>

          <form onSubmit={handleSubmit} className="evaluation-form">
            <fieldset>
              <legend><span>1</span> Datos del candidato</legend>
              <div className="form-grid">
                <Field label="Nombre completo" name="nombre" value={form.nombre} onChange={update} required />
                <Field label="RUT o identificador" name="identificador" value={form.identificador} onChange={update} required />
                <Field label="Cargo al que postula" name="cargo" value={form.cargo} onChange={update} required />
                <Field label="Instalación, planta o centro" name="centroTrabajo" value={form.centroTrabajo} onChange={update} required />
                <Field label="Región o localidad" name="localidad" value={form.localidad} onChange={update} required />
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
