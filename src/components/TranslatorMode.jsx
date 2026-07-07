import { useState } from 'react'
import SignPlayer from './SignPlayer.jsx'
import { useSpeechToText } from '../lib/useSpeechToText.js'

const EXAMPLES = ['Hola', 'España', 'Mañana', 'Te quiero']

// Modo Traductor: escribe o dicta un texto y se reproduce deletreado en señas.
export default function TranslatorMode() {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState('')

  const { supported, listening, error, start, stop } = useSpeechToText({
    lang: 'es-ES',
    onText: (t, isFinal) => {
      setText(t)
      if (isFinal) setSubmitted(t)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(text)
  }

  return (
    <div className="translator">
      <section className="panel">
        <form onSubmit={handleSubmit} className="tr-form">
          <label htmlFor="tr-input">Escribe o dicta un texto</label>
          <div className="tr-row">
            <input
              id="tr-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="p. ej. tu nombre"
            />
            <button
              type="button"
              className={'mic-btn' + (listening ? ' on' : '')}
              onClick={listening ? stop : start}
              disabled={!supported}
              title={supported ? 'Dictar por voz' : 'Tu navegador no soporta dictado por voz'}
            >
              {listening ? '● Escuchando…' : '🎤 Voz'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
              Signar
            </button>
          </div>

          <div className="examples">
            <span>Prueba:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                className="chip"
                onClick={() => {
                  setText(ex)
                  setSubmitted(ex)
                }}
              >
                {ex}
              </button>
            ))}
          </div>

          {listening && (
            <p className="voice-live">
              🎙️ Habla ahora… lo que digas aparecerá en el campo de texto.
            </p>
          )}

          {error && <p className="voice-error">⚠️ {error}</p>}

          {!supported && (
            <p className="hint">
              🎤 Tu navegador no incluye dictado por voz (Firefox no lo
              soporta). Úsalo en <strong>Google Chrome o Edge</strong>, o
              escribe el texto.
            </p>
          )}
        </form>
      </section>

      <section className="panel">
        <SignPlayer text={submitted} />
      </section>
    </div>
  )
}
