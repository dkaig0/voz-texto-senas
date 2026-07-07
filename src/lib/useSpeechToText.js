import { useEffect, useRef, useState } from 'react'

// Mensajes claros para cada error posible del dictado.
const ERROR_MESSAGES = {
  'not-allowed':
    'Permiso de micrófono denegado. Pulsa el candado 🔒 junto a la dirección y permite el micrófono. En Windows revisa también Configuración → Privacidad → Micrófono.',
  'service-not-allowed':
    'El navegador bloqueó su servicio de voz. Prueba en Google Chrome.',
  'audio-capture':
    'No se encontró ningún micrófono. Conecta uno o revisa el sonido de Windows.',
  network:
    'El dictado necesita internet (el navegador usa un servicio de voz en línea). Revisa tu conexión; si persiste, prueba en Google Chrome.',
  'no-speech': 'No se escuchó nada. Acércate al micrófono e inténtalo otra vez.',
  'language-not-supported':
    'Tu navegador no soporta dictado en español. Prueba en Google Chrome.',
  aborted: null, // cancelado por el usuario: no es un error
}

// Hook para dictado por voz con la Web Speech API (gratis, integrada en el
// navegador; funciona en Chrome/Edge). onText recibe (texto, esFinal).
export function useSpeechToText({ lang = 'es-ES', onText } = {}) {
  const Recognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = !!Recognition

  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort()
      } catch (_) {}
    }
  }, [])

  async function start() {
    if (!supported || listening) return
    setError(null)

    // 1) Pedimos el micrófono explícitamente: así el navegador muestra el
    //    aviso de permiso y, si falla, sabemos exactamente por qué.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop()) // solo era para el permiso
    } catch (e) {
      setError(
        e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError'
          ? ERROR_MESSAGES['audio-capture']
          : ERROR_MESSAGES['not-allowed']
      )
      return
    }

    // 2) Arrancamos el reconocimiento.
    const rec = new Recognition()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      let txt = ''
      let isFinal = false
      for (let i = 0; i < e.results.length; i++) {
        txt += e.results[i][0].transcript
        if (e.results[i].isFinal) isFinal = true
      }
      onTextRef.current?.(txt, isFinal)
    }
    rec.onerror = (e) => {
      const msg = ERROR_MESSAGES[e.error]
      if (msg !== null) setError(msg || `Error de dictado: ${e.error}`)
    }
    rec.onend = () => setListening(false)

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch (e) {
      setError('No se pudo iniciar el dictado: ' + (e?.message || e))
    }
  }

  function stop() {
    try {
      recRef.current?.stop()
    } catch (_) {}
    setListening(false)
  }

  return { supported, listening, error, start, stop }
}
