function FormField({ label, name, children, hint, required = false, ...inputProps }) {
  return (
    <label className="field">
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      {children ?? <input name={name} required={required} {...inputProps} />}
      {hint && <small>{hint}</small>}
    </label>
  )
}

export default FormField

