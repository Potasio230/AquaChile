function FormStatus({ status }) {
  if (!status?.message) return null

  return (
    <div className={`form-status ${status.type}`} role="status" aria-live="polite">
      {status.message}
    </div>
  )
}

export default FormStatus

