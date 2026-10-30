import { statusLabels } from '../data/evaluationOptions'

function StatusBadge({ status }) {
  const normalized = status || 'POSTULADO'
  return (
    <span className={`status-badge status-${normalized.toLowerCase()}`}>
      {statusLabels[normalized] || normalized}
    </span>
  )
}

export default StatusBadge

