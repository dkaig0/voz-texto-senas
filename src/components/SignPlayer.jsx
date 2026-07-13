// ============================================================================
// SignPlayer.jsx — REPRODUCTOR DEL DELETREO EN SEÑAS.
// Recibe un texto por props, lo convierte en pasos con textToSteps() y los
// va mostrando uno a uno con un temporizador (como un reproductor de video).
// ============================================================================

import { useEffect, useMemo, useState } from 'react'
import { textToSteps } from '../lib/alphabet.js'

// Velocidades disponibles: milisegundos que dura cada letra en pantalla.
const SPEEDS = [
  { label: 'Lento', ms: 1200 },
  { label: 'Normal', ms: 750 },
  { label: 'Rápido', ms: 450 },
]

export default function SignPlayer({ text, autoPlay = true }) {
  // useMemo: convierte el texto en pasos SOLO cuando el texto cambia
  // (evita recalcular en cada render).
  const steps = useMemo(() => textToSteps(text), [text])
  const [index, setIndex] = useState(0) // paso (letra) actual
  const [playing, setPlaying] = useState(false) // ¿reproduciendo?
  const [speed, setSpeed] = useState(750) // velocidad elegida

  // Cuando llega un texto nuevo: volver al inicio y reproducir solo.
  useEffect(() => {
    setIndex(0)
    setPlaying(autoPlay && steps.length > 0)
  }, [steps, autoPlay])

  // EL MOTOR DEL REPRODUCTOR: mientras playing sea true, programa un
  // setTimeout que avanza a la siguiente letra. La función de limpieza
  // (return) cancela el temporizador para no dejar timers colgados.
  useEffect(() => {
    if (!playing) return
    if (index >= steps.length - 1) {
      setPlaying(false) // llegamos al final
      return
    }
    const cur = steps[index]
    // Los espacios y símbolos duran la mitad que una letra.
    const dur = cur && cur.type === 'letter' ? speed : Math.max(250, speed / 2)
    const t = setTimeout(() => setIndex((i) => i + 1), dur)
    return () => clearTimeout(t)
  }, [playing, index, steps, speed])

  // Sin texto todavía: mensaje de ayuda.
  if (!steps.length) {
    return (
      <div className="player-empty">
         Escribe o dicta algo y lo verás deletreado en señas.
      </div>
    )
  }

  const cur = steps[index] // paso que se muestra ahora
  const atEnd = index >= steps.length - 1 // ¿estamos en la última letra?

  // Esta función arranca la reproducción (si terminó, vuelve a empezar).
  function play() {
    if (atEnd) setIndex(0)
    setPlaying(true)
  }

  return (
    <div className="player">
      {/* ESCENARIO: la seña grande del paso actual */}
      <div className="player-stage">
        {cur.type === 'letter' && (
          <>
            <div className="letter-wrap">
              <img className="letter-img" src={cur.src} alt={`Seña de ${cur.char}`} />
              {/* Si es la Ñ, se superpone la tilde animada */}
              {cur.tilde && <span className="tilde-mark">〜</span>}
            </div>
            <span className="letter-caption">{cur.display.toUpperCase()}</span>
            {cur.note && <small className="letter-note">{cur.note}</small>}
          </>
        )}
        {cur.type === 'space' && <span className="stage-msg">espacio</span>}
        {cur.type === 'other' && (
          <div className="stage-other">
            <span className="stage-other-char">{cur.display}</span>
            <small>sin seña en el abecedario</small>
          </div>
        )}
      </div>

      {/* TIRA DE LA PALABRA: cada letra es un botón; clic = saltar a ella */}
      <div className="word-strip">
        {steps.map((s, i) => (
          <button
            key={i}
            className={
              'word-letter' +
              (i === index ? ' current' : '') + // letra actual resaltada
              (s.type !== 'letter' ? ' muted' : '') // espacios/símbolos apagados
            }
            onClick={() => {
              setPlaying(false)
              setIndex(i)
            }}
            title="Ir a esta letra"
          >
            {s.type === 'space' ? '·' : s.display.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CONTROLES: anterior / reproducir-pausa / siguiente + velocidad */}
      <div className="player-controls">
        <div className="ctrl-group">
          <button
            className="icon-btn"
            onClick={() => {
              setPlaying(false)
              setIndex((i) => Math.max(0, i - 1)) // no baja de 0
            }}
            title="Anterior"
          >
            ⏮
          </button>
          {/* El botón central cambia según el estado: Pausa / Repetir / Reproducir */}
          <button className="btn btn-primary play-btn" onClick={playing ? () => setPlaying(false) : play}>
            {playing ? '⏸ Pausa' : atEnd ? '↻ Repetir' : '▶ Reproducir'}
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setPlaying(false)
              setIndex((i) => Math.min(steps.length - 1, i + 1)) // no pasa del final
            }}
            title="Siguiente"
          >
            ⏭
          </button>
        </div>

        {/* Selector de velocidad (Lento / Normal / Rápido) */}
        <div className="segmented speed">
          {SPEEDS.map((s) => (
            <button
              key={s.ms}
              className={speed === s.ms ? 'active' : ''}
              onClick={() => setSpeed(s.ms)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Progreso: letra actual / total */}
        <span className="player-progress">
          {index + 1} / {steps.length}
        </span>
      </div>
    </div>
  )
}
