import { useEffect, useMemo, useState } from 'react'
import { textToSteps } from '../lib/alphabet.js'

const SPEEDS = [
  { label: 'Lento', ms: 1200 },
  { label: 'Normal', ms: 750 },
  { label: 'Rápido', ms: 450 },
]

// Reproduce un texto deletreado en señas, letra por letra.
export default function SignPlayer({ text, autoPlay = true }) {
  const steps = useMemo(() => textToSteps(text), [text])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(750)

  // Al cambiar el texto: volver al inicio y (opcionalmente) reproducir.
  useEffect(() => {
    setIndex(0)
    setPlaying(autoPlay && steps.length > 0)
  }, [steps, autoPlay])

  // Avance automático mientras "playing".
  useEffect(() => {
    if (!playing) return
    if (index >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const cur = steps[index]
    const dur = cur && cur.type === 'letter' ? speed : Math.max(250, speed / 2)
    const t = setTimeout(() => setIndex((i) => i + 1), dur)
    return () => clearTimeout(t)
  }, [playing, index, steps, speed])

  if (!steps.length) {
    return (
      <div className="player-empty">
        ✍️ Escribe o dicta algo y lo verás deletreado en señas.
      </div>
    )
  }

  const cur = steps[index]
  const atEnd = index >= steps.length - 1

  function play() {
    if (atEnd) setIndex(0)
    setPlaying(true)
  }

  return (
    <div className="player">
      <div className="player-stage">
        {cur.type === 'letter' && (
          <>
            <div className="letter-wrap">
              <img className="letter-img" src={cur.src} alt={`Seña de ${cur.char}`} />
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

      {/* Palabra completa con la letra actual resaltada */}
      <div className="word-strip">
        {steps.map((s, i) => (
          <button
            key={i}
            className={
              'word-letter' +
              (i === index ? ' current' : '') +
              (s.type !== 'letter' ? ' muted' : '')
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

      {/* Controles */}
      <div className="player-controls">
        <div className="ctrl-group">
          <button
            className="icon-btn"
            onClick={() => {
              setPlaying(false)
              setIndex((i) => Math.max(0, i - 1))
            }}
            title="Anterior"
          >
            ⏮
          </button>
          <button className="btn btn-primary play-btn" onClick={playing ? () => setPlaying(false) : play}>
            {playing ? '⏸ Pausa' : atEnd ? '↻ Repetir' : '▶ Reproducir'}
          </button>
          <button
            className="icon-btn"
            onClick={() => {
              setPlaying(false)
              setIndex((i) => Math.min(steps.length - 1, i + 1))
            }}
            title="Siguiente"
          >
            ⏭
          </button>
        </div>

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

        <span className="player-progress">
          {index + 1} / {steps.length}
        </span>
      </div>
    </div>
  )
}
