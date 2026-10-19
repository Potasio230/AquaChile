import { useEffect } from 'react'

/* ==========================================================================
   AJUSTES DEL SCROLL ANIMADO
   Cambiá estos valores y guardá; Vite recarga solo.

   duration             — cuánto dura el viaje, en milisegundos.
                          MÁS ALTO = MÁS LENTO.  El scroll nativo del
                          navegador ronda los 300-500 ms, por eso 800 ms
                          casi no se notaba. Probá 1500, 2000, 2500...

   easing               — la curva del movimiento. Opciones listas abajo.

   respectReducedMotion — ATENCIÓN: si está en true y tu sistema operativo
                          tiene desactivadas las animaciones, el scroll
                          salta de inmediato y NUNCA vas a ver la animación.
                          Poné false para forzarla igual.
   ========================================================================== */

const CONFIG = {
  duration: 1500,
  easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), // easeInOutCubic
  respectReducedMotion: true,
}

/* Otras curvas, por si querés probar. Reemplazá `easing` por una de estas:

   Suave y pareja, arranca y frena muy gradual:
   (t) => -(Math.cos(Math.PI * t) - 1) / 2

   Intermedia, un poco más marcada que la anterior:
   (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

   Arranca lento y acelera casi hasta el final, después frena de golpe:
   (t) => t * t * (3 - 2 * t)
*/

const INTERRUPTERS = ['wheel', 'touchstart', 'keydown']

// Solo en desarrollo: expone los ajustes en la consola del navegador para
// probar velocidades sin editar nada.  Ejemplo, en la consola (F12):
//     __scrollConfig.duration = 2500
// Luego hacé clic en un enlace del menú para sentir el cambio.
if (import.meta.env.DEV) window.__scrollConfig = CONFIG

export default function useSmoothScroll() {
  useEffect(() => {
    let frameId = null

    const stop = () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
    }

    const handleClick = (event) => {
      // Ignora clics con modificadores: Ctrl/Cmd debe abrir en pestaña nueva.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      // `closest` sube por el árbol: funciona aunque el clic caiga en el
      // <svg> del indicador o en un <span> dentro del enlace.
      const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null
      if (!link) return

      const hash = link.getAttribute('href')
      if (!hash || hash === '#') return

      let target
      try {
        target = document.querySelector(hash)
      } catch {
        return // hash que no es un selector válido (p. ej. "#[")
      }
      if (!target) return

      event.preventDefault()
      stop()

      const header = document.querySelector('.site-header')
      const startY = window.scrollY
      const endY = Math.max(0, target.getBoundingClientRect().top + startY - (header?.offsetHeight ?? 0))
      const reduceMotion = CONFIG.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const finish = () => {
        frameId = null
        if (window.location.hash !== hash) window.history.pushState(null, '', hash)
      }

      if (reduceMotion || Math.abs(endY - startY) < 2) {
        window.scrollTo({ top: endY, behavior: 'instant' })
        finish()
        return
      }

      const startTime = performance.now()

      const step = (now) => {
        const progress = Math.min((now - startTime) / CONFIG.duration, 1)
        window.scrollTo({
          top: startY + (endY - startY) * CONFIG.easing(progress),
          // `instant` es obligatorio: sin esto, cada fotograma dispararía
          // otra animación del `scroll-behavior: smooth` del CSS y temblaría.
          behavior: 'instant',
        })
        if (progress < 1) frameId = requestAnimationFrame(step)
        else finish()
      }

      frameId = requestAnimationFrame(step)
    }

    document.addEventListener('click', handleClick)
    INTERRUPTERS.forEach((type) => window.addEventListener(type, stop, { passive: true }))

    return () => {
      stop()
      document.removeEventListener('click', handleClick)
      INTERRUPTERS.forEach((type) => window.removeEventListener(type, stop))
    }
  }, [])
}
