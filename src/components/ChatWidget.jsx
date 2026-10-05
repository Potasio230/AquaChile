import { useState, useEffect, useRef } from 'react'
import salmonCerrado from '../../assets/salmon_cerrado.png'
import salmonAbierto from '../../assets/salmon_abierto.png'

const PREGUNTAS_FRECUENTES = [
  {
    titulo: '¿Cómo funciona el turno 14x14?',
    respuesta: 'El régimen 14x14 consiste en 14 días continuos de trabajo en pontón o centro de cultivo, seguidos de 14 días de descanso compensatorio ininterrumpido. AquaChile cubre traslados marítimos, alimentación completa y habitabilidad en pontones climatizados.'
  },
  {
    titulo: '¿Qué certificaciones exigen para faena?',
    respuesta: 'Para labores marítimas y operativas se requiere Examen Médico Ocupacional vigente para grandes altitudes geográficas/marítimas, y según el cargo: Licencia D (Grúa Horquilla), Matrícula de Buceo o Certificación SEC (eléctricos).'
  },
  {
    titulo: '¿En qué consiste la evaluación psicológica?',
    respuesta: 'Es una entrevista técnica y por competencias focalizada en adaptabilidad al aislamiento geográfico, trabajo en equipo en pontón, comunicación asertiva y apego estricto a las normas de seguridad y bioseguridad de AquaChile.'
  },
  {
    titulo: '¿Cómo hago seguimiento a mi postulación?',
    respuesta: 'Al completar el formulario web recibirás un código de solicitud y un correo de confirmación oficial. El analista a cargo revisará tus antecedentes y te contactará por teléfono o correo para coordinar la entrevista.'
  }
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy Salmón Asistente de AquaChile. ¿En qué te puedo orientar hoy sobre el proceso de postulación?'
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTalking, setIsTalking] = useState(false)
  const [mouthOpen, setMouthOpen] = useState(false)

  const messagesEndRef = useRef(null)

  // Auto-scroll hacia el final del chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTalking])

  // Animación de hablar (alternar entre boca abierta y cerrada)
  useEffect(() => {
    if (!isTalking) {
      setMouthOpen(false)
      return
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev)
    }, 220)
    return () => clearInterval(interval)
  }, [isTalking])

  // Efecto máquina de escribir (Typewriter)
  const escribirRespuestaBot = (textoCompleto) => {
    setIsTalking(true)
    let index = 0
    // Añadimos el mensaje vacío del bot que se irá rellenando
    setMessages((prev) => [...prev, { sender: 'bot', text: '' }])

    const intervalId = setInterval(() => {
      index++
      const trozo = textoCompleto.slice(0, index)
      setMessages((prev) => {
        const actualizados = [...prev]
        actualizados[actualizados.length - 1] = { sender: 'bot', text: trozo }
        return actualizados
      })

      if (index >= textoCompleto.length) {
        clearInterval(intervalId)
        setIsTalking(false)
      }
    }, 18) // velocidad natural de tipeo
  }

  const handleSelectFAQ = (faq) => {
    if (isTalking) return
    const userMsg = { sender: 'user', text: faq.titulo }
    setMessages((prev) => [...prev, userMsg])
    setTimeout(() => {
      escribirRespuestaBot(faq.respuesta)
    }, 250)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || isTalking) return

    const userText = inputText.trim()
    setInputText('')
    setMessages((prev) => [...prev, { sender: 'user', text: userText }])

    try {
      const res = await fetch('http://127.0.0.1:8000/api/chat/consulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userText })
      })
      if (res.ok) {
        const data = await res.json()
        escribirRespuestaBot(data.respuesta)
        return
      }
      throw new Error('API desconectada')
    } catch {
      setTimeout(() => {
        escribirRespuestaBot(
          `Gracias por tu consulta sobre "${userText}". Si tu duda refiere a requerimientos de ingreso, turnos 14x14 en pontón o certificaciones, puedes pulsar una de las preguntas frecuentes sugeridas o completar el formulario de postulación para que el analista revise tu ficha directamente.`
        )
      }, 350)
    }
  }

  const avatarActual = mouthOpen ? salmonAbierto : salmonCerrado

  return (
    <div className="chat-widget-container">
      {/* Ventana del Chat */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="salmon-avatar-header">
                <img src={avatarActual} alt="Salmón AquaChile" className="avatar-img" />
              </div>
              <div>
                <strong>Asistente Salmón</strong>
                <small>{isTalking ? 'Hablando…' : 'En línea · Orientación AquaChile'}</small>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)} aria-label="Cerrar chat">✕</button>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-message ${m.sender}`}>
                {m.sender === 'bot' && (
                  <img
                    src={idx === messages.length - 1 && isTalking ? avatarActual : salmonCerrado}
                    alt="Salmón"
                    className="msg-avatar"
                  />
                )}
                <div className="chat-bubble">
                  {m.text}
                  {m.sender === 'bot' && isTalking && idx === messages.length - 1 && (
                    <span className="typewriter-cursor">|</span>
                  )}
                </div>
              </div>
            ))}

            {/* Chips de Preguntas Frecuentes */}
            <div className="chat-faq-chips">
              <span className="chat-faq-label">Preguntas frecuentes:</span>
              {PREGUNTAS_FRECUENTES.map((faq, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="chat-chip-btn"
                  disabled={isTalking}
                  onClick={() => handleSelectFAQ(faq)}
                >
                  {faq.titulo}
                </button>
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Formulario de Entrada */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              placeholder={isTalking ? 'El asistente está respondiendo…' : 'Escribe tu consulta aquí...'}
              value={inputText}
              disabled={isTalking}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="chat-send-btn" disabled={!inputText.trim() || isTalking}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Botón Circular Flotante con Icono del Salmón */}
      <button
        className={`chat-floating-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir asistente de preguntas"
      >
        {isOpen ? (
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>✕</span>
        ) : (
          <img src={salmonCerrado} alt="Chatbot Salmón" className="floating-salmon-icon" />
        )}
      </button>
    </div>
  )
}
