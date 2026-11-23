import { useState } from 'react'
import { api } from '../services/api'
import FormField from '../components/FormField'
import FormStatus from '../components/FormStatus'
import { areas, cargos, centros, demoCandidates, familias, initialApplicationForm, localidades, turnos } from '../data/formOptions'
import { validateApplication } from '../utils/validation'

const applicantFields = [
  'nombre', 'identificador', 'email', 'telefono', 'cargo', 'centroTrabajo',
  'localidad', 'observaciones', 'cv',
]

const internalFields = [
  'familiaCargo', 'area', 'turno', 'fechaInforme', 'analista', 'correoAnalista',
]

function PostulacionPage() {
  const [form, setForm] = useState(initialApplicationForm)
  const [applicantStatus, setApplicantStatus] = useState({ type: 'idle', message: '' })
  const [analystStatus, setAnalystStatus] = useState({ type: 'idle', message: '' })

  const update = ({ target }) => {
    const value = target.type === 'file' ? target.files?.[0] ?? null : target.value
    setForm((current) => ({ ...current, [target.name]: value }))
  }

  const clearFields = (fields) => setForm((current) => ({
    ...current,
    ...Object.fromEntries(fields.map((key) => [key, initialApplicationForm[key]])),
  }))

  const handleApplicantSubmit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const validationMessage = validateApplication(form)
    if (validationMessage) {
      setApplicantStatus({ type: 'error', message: validationMessage })
      return
    }
    setApplicantStatus({ type: 'loading', message: 'Registrando solicitud…' })

    try {
      const data = new FormData()
      const fieldMap = {
        nombre: form.nombre, rut: form.identificador, email: form.email, telefono: form.telefono,
        cargo: form.cargo, familia_cargo: form.familiaCargo, centro_trabajo: form.centroTrabajo,
        localidad: form.localidad, area: form.area, turno: form.turno,
        fecha_informe: form.fechaInforme, observaciones: form.observaciones,
      }
      Object.entries(fieldMap).forEach(([key, value]) => data.append(key, value))
      data.append('cv', form.cv)
      const result = await api.createApplication(data)
      const emailMessage = {
        enviado: 'Se enviaron los correos de confirmación y aviso al analista.',
        parcial: 'Solo se pudo enviar uno de los dos correos. El equipo puede revisar la solicitud en el sistema.',
        fallido: 'No se pudieron enviar los correos. La solicitud quedó guardada en el sistema.',
        no_configurado: 'El correo aún no está configurado. La solicitud quedó guardada en el sistema.',
      }[result.notificacion_email] || 'La solicitud quedó guardada en el sistema.'
      setApplicantStatus({
        type: result.notificacion_email === 'enviado' ? 'success' : 'warning',
        message: `Solicitud registrada. Código: ${result.codigo}. ${emailMessage}`,
      })
      clearFields(applicantFields)
      formElement.reset()
    } catch (error) {
      setApplicantStatus({ type: 'error', message: `${error.message}. Verifica que el servidor esté iniciado.` })
    }
  }

  const handleAnalystSubmit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    if (!form.analista.trim() || !form.correoAnalista.trim()) {
      setAnalystStatus({ type: 'error', message: 'Ingresa el nombre y el correo del analista.' })
      return
    }
    setAnalystStatus({ type: 'loading', message: 'Registrando datos internos…' })

    try {
      const result = await api.createAnalystRequest({
        familia_cargo: form.familiaCargo,
        area: form.area,
        turno: form.turno,
        fecha_informe: form.fechaInforme,
        analista: form.analista.trim(),
        correo_analista: form.correoAnalista.trim(),
      })
      setAnalystStatus({ type: 'success', message: result.mensaje })
      clearFields(internalFields)
      formElement.reset()
    } catch (error) {
      setAnalystStatus({ type: 'error', message: `${error.message}. Verifica que el servidor esté iniciado.` })
    }
  }

  return (
    <section className="form-section" id="formulario">
      <div className="form-heading">
        <span className="section-kicker">Nueva solicitud</span>
        <h2>Evaluación psicolaboral</h2>
        <p>Completa los campos obligatorios. Para las pruebas del proyecto, utiliza únicamente información ficticia.</p>

        <div className="demo-actions">
          <span>Autorellenar prueba:</span>
          {demoCandidates.map((candidate, index) => (
            <button
              key={candidate.label}
              type="button"
              className={index === 1 ? 'demo-button featured' : 'demo-button'}
              onClick={() => setForm({
                ...candidate.values,
                cv: new File(['Currículum ficticio para demostración'], `CV_${candidate.values.nombre.replaceAll(' ', '_')}.pdf`, { type: 'application/pdf' }),
              })}
            >
              {candidate.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjeta 1: datos del postulante */}
      <form onSubmit={handleApplicantSubmit} className="evaluation-form" aria-label="Datos del postulante">
        <fieldset>
          <legend><span>1</span> Datos del candidato</legend>
          <div className="form-grid">
            <FormField label="Nombre completo" name="nombre" value={form.nombre} onChange={update} required />
            <FormField label="RUT o identificador" name="identificador" value={form.identificador} onChange={update} required />
            <FormField label="Correo electrónico" name="email" type="email" value={form.email} onChange={update} required />
            <FormField label="Teléfono" name="telefono" type="tel" value={form.telefono} onChange={update} required />
            <FormField label="Cargo al que postula" required>
              <select name="cargo" value={form.cargo} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {cargos.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Instalación, planta o centro" required>
              <select name="centroTrabajo" value={form.centroTrabajo} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {centros.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Localidad" required>
              <select name="localidad" value={form.localidad} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {localidades.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
          </div>
        </fieldset>

        <fieldset>
          <legend><span>2</span> Antecedentes adicionales</legend>
          <div className="form-grid">
            <FormField label="Observaciones" hint="No incluyas información sensible que no sea necesaria.">
              <textarea name="observaciones" value={form.observaciones} onChange={update} rows="4" />
            </FormField>
            <FormField label="Currículum del candidato" required hint="Formato PDF o Word. Máximo 10 MB.">
              <span className="file-picker">
                <input
                  id="cv-upload"
                  className="file-picker-input"
                  name="cv"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={update}
                  aria-label="Elegir currículum"
                  required
                />
                <span className="file-picker-button" aria-hidden="true">Elegir archivo</span>
                <span className="file-picker-name" aria-live="polite">
                  {form.cv?.name || 'Ningún archivo seleccionado'}
                </span>
              </span>
            </FormField>
          </div>
        </fieldset>

        <FormStatus status={applicantStatus} />
        <div className="form-actions">
          <p><b>*</b> Campos obligatorios</p>
          <button className="submit-button" type="submit" disabled={applicantStatus.type === 'loading'}>
            {applicantStatus.type === 'loading' ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </form>

      {/* Tarjeta 2: datos internos (solicitud + analista) */}
      <div className="form-heading form-heading--spaced">
        <span className="section-kicker">Solicitud interna</span>
        <h2>Datos de la solicitud y del analista</h2>
        <p>Cargo, plazos y responsable de la evaluación. Estos datos los completa el equipo de selección.</p>
      </div>

      <form onSubmit={handleAnalystSubmit} className="evaluation-form" aria-label="Datos de la solicitud y del analista">
        <fieldset>
          <legend><span>1</span> Datos de la solicitud</legend>
          <div className="form-grid">
            <FormField label="Familia de cargo" required>
              <select name="familiaCargo" value={form.familiaCargo} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {familias.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Área" required>
              <select name="area" value={form.area} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {areas.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Sistema de turno" required>
              <select name="turno" value={form.turno} onChange={update} required>
                <option value="">Selecciona una opción</option>
                {turnos.map((item) => <option key={item}>{item}</option>)}
              </select>
            </FormField>
            <FormField label="Fecha requerida para el informe" name="fechaInforme" type="date" value={form.fechaInforme} onChange={update} required />
          </div>
        </fieldset>

        <fieldset>
          <legend><span>2</span> Analista responsable</legend>
          <div className="form-grid">
            <FormField label="Nombre del analista" name="analista" value={form.analista} onChange={update} required />
            <FormField label="Correo del analista" name="correoAnalista" type="email" value={form.correoAnalista} onChange={update} required />
          </div>
        </fieldset>

        <FormStatus status={analystStatus} />
        <div className="form-actions">
          <p><b>*</b> Campos obligatorios</p>
          <button className="submit-button" type="submit" disabled={analystStatus.type === 'loading'}>
            {analystStatus.type === 'loading' ? 'Enviando…' : 'Enviar datos del analista'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default PostulacionPage
