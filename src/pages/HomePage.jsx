import { Link } from 'react-router-dom'
import heroPoster from '../../assets/Cultivos.jpg'
import heroVideo from '../../assets/BackgroundAquaChile.mp4'
import salmon from '../../assets/Salmón.png'

function HomePage() {
  return (
    <>
      <section className="hero" id="inicio">
        <video autoPlay loop muted playsInline poster={heroPoster}>
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1>Evaluaciones más ágiles, decisiones más humanas.</h1>
          <p>
            Centralizamos la solicitud de evaluaciones psicolaborales para acompañar cada proceso con precisión, seguridad y cercanía.
          </p>
          <Link className="primary-button" to="/postulacion">
            Iniciar una solicitud
          </Link>
        </div>
        <a className="scroll-indicator" href="#proceso" aria-label="Continuar al contenido">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>
      </section>

      <section className="process-section" id="proceso">
        <div className="salmon-visual">
          <img src={salmon} alt="Salmón AquaChile" />
        </div>
        <div className="process-copy">
          <h2>¿Cómo funciona?</h2>
          <p>
            Esta solicitud reúne los antecedentes necesarios para preparar la evaluación y activar el flujo automatizado del equipo de Reclutamiento y Selección.
          </p>
        </div>
      </section>
    </>
  )
}

export default HomePage
