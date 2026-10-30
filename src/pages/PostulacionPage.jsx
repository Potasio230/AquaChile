import { useState } from 'react'
import { api } from '../services/api'
import FormField from '../components/FormField'
import FormStatus from '../components/FormStatus'
import { areas, cargos, centros, demoCandidates, familias, initialApplicationForm, localidades, turnos } from '../data/formOptions'
import { validateApplication } from '../utils/validation'

function PostulacionPage() {
  const [form, setForm] = useState(initialApplicationForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })

  const update = ({ target }) => {
    const value = target.type === 'file' ? target.files?.[0] ?? null : target.value
    setForm((current) => ({ ...current, [target.name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    const validationMessage = validateApplication(form)
    if (validationMessage) {
      setStatus({ type: 'error', message: validationMessage })
      return
    }
    setStatus({ type: 'loading', message: 'Registrando solicitud…' })

    try {
      const data = new FormData()
      const fieldMap = {
        nombre: form.nombre, rut: form.identificador, email: form.email, telefono: form.telefono,
        cargo: form.cargo, familia_cargo: form.familiaCargo, centro_trabajo: form.centroTrabajo,
        localidad: form.localidad, area: form.area, turno: form.turno, analista: form.analista,
        correo_analista: form.correoAnalista, fecha_informe: form.fechaInforme,
        observaciones: form.observaciones,
      }
      Object.entries(fieldMap).forEach(([key, value]) => data.append(key, value))
      data.append('cv', form.cv)
      const result = await api.createApplication(data)
      setStatus({ type: 'success', message: `¡Solicitud registrada! Tu código de seguimiento es ${result.codigo}.` })
      setForm(initialApplicationForm)
      formElement.reset()
    } catch (error) {
      setStatus({ type: 'error', message: `${error.message}. Verifica que el servidor esté iniciado.` })
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

      <form onSubmit={handleSubmit} className="evaluation-form">
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
          <legend><span>2</span> Datos de la solicitud</legend>
          <div className="form-grid">
            <FormField label="Nombre del analista" name="analista" value={form.analista} onChange={update} required />
            <FormField label="Correo del analista" name="correoAnalista" type="email" value={form.correoAnalista} onChange={update} required />
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
          <legend><span>3</span> Antecedentes adicionales</legend>
          <div className="form-grid">
            <FormField label="Observaciones" hint="No incluyas información sensible que no sea necesaria.">
              <textarea name="observaciones" value={form.observaciones} onChange={update} rows="4" />
            </FormField>
            <FormField label="Currículum del candidato" required hint="Formato PDF o Word. Máximo 10 MB.">
              <input name="cv" type="file" accept=".pdf,.doc,.docx" onChange={update} required />
            </FormField>
          </div>
        </fieldset>

        <FormStatus status={status} />
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
