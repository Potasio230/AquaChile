import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function ApplicationTable({ applications }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr><th>Código</th><th>Candidato</th><th>Cargo</th><th>Localidad</th><th>Estado</th><th><span className="visually-hidden">Acciones</span></th></tr>
        </thead>
        <tbody>
          {applications.map((item) => (
            <tr key={item.id}>
              <td><strong>{item.codigo}</strong></td>
              <td>{item.nombre_completo}<small>{item.rut}</small></td>
              <td>{item.cargo}<small>{item.centro_trabajo}</small></td>
              <td>{item.localidad}</td>
              <td><StatusBadge status={item.estado} /></td>
              <td><Link className="table-action" to={`/gestion/evaluacion/${item.id}`}>Revisar</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ApplicationTable

