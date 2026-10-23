import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <p className="section-kicker">Error 404</p>
      <h1 id="not-found-title">No encontramos esta página</h1>
      <p>La dirección puede haber cambiado o no existir.</p>
      <Link className="primary-button" to="/">Volver al inicio</Link>
    </section>
  )
}

export default NotFoundPage
