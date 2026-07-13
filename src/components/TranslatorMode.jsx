// ============================================================================
// TranslatorMode.jsx — MODO TRADUCTOR (pestaña principal).
// La persona escribe o dicta un texto; el texto confirmado se pasa por
// props a <SignPlayer>, que lo reproduce en señas.
// ============================================================================

import { useState } from 'react'
import SignPlayer from './SignPlayer.jsx'
import { useSpeechToText } from '../lib/useSpeechToText.js'

// Ejemplos rápidos para probar (España y Mañana lucen la Ñ).
const EXAMPLES = ['Hola', 'España', 'Mañana', 'Te quiero']

export default function TranslatorMode() {
  const [text, setText] = useState('') // lo que hay en el input
  const [submitted, setSubmitted] = useState('') // lo que se está signando

  // AQUÍ se conecta el hook de dictado por voz.
  // onText llega con cada resultado: actualiza el input en vivo y, cuando
  // es final (dejaste de hablar), lo manda directo al reproductor.
  const { supported, listening, error, start, stop } = useSpeechToText({
    lang: 'es-ES',
    onText: (t, isFinal) => {
      setText(t)
      if (isFinal) setSubmitted(t)
    },
  })

  // Esta función confirma el texto escrito (botón Signar / tecla Enter).
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
            {/* Input controlado: su valor vive en el estado "text" */}
            <input
              id="tr-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="p. ej. tu nombre"
            />
            {/* Botón de voz: alterna entre escuchar y parar */}
            <button
              type="button"
              className={'mic-btn' + (listening ? ' on' : '')}
              onClick={listening ? stop : start}
              disabled={!supported}
              title={supported ? 'Dictar por voz' : 'Tu navegador no soporta dictado por voz'}
            >
              {listening ? '● Escuchando…' : ' Voz'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
              Signar
            </button>
          </div>

          {/* Chips de ejemplo: rellenan y signan al instante */}
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

          {/* Avisos de estado del dictado (solo se pintan cuando tocan) */}
          {listening && (
            <p className="voice-live">
              Habla ahora… lo que digas aparecerá en el campo de texto.
            </p>
          )}

          {error && <p className="voice-error">⚠️ {error}</p>}

          {!supported && (
            <p className="hint">
              Tu navegador no incluye dictado por voz (Firefox no lo
              soporta). Úsalo en <strong>Google Chrome o Edge</strong>, o
              escribe el texto.
            </p>
          )}
        </form>
      </section>

      {/* Comunicación entre componentes: el texto baja por props */}
      <section className="panel">
        <SignPlayer text={submitted} />
      </section>
    </div>
  )
}
