// ============================================================================
// useSpeechToText.js — HOOK PERSONALIZADO de dictado por voz.
//
// Encapsula la Web Speech API del navegador (gratis, sin claves) para que
// los componentes solo tengan que llamar a start() y stop().
// Funciona en Chrome/Edge; Brave la bloquea y Firefox no la implementa.
// ============================================================================

import { useEffect, useRef, useState } from 'react'

// AQUÍ están los mensajes de error: cada código técnico del navegador se
// traduce a un mensaje claro en español con su solución.
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
  aborted: null, // cancelado por el usuario: no es un error real
}

// EL HOOK. Recibe el idioma y un callback onText(texto, esFinal) que se
// dispara con cada resultado (parcial mientras hablas, final al terminar).
// Devuelve { supported, listening, error, start, stop }.
export function useSpeechToText({ lang = 'es-ES', onText } = {}) {
  // AQUÍ se detecta si el navegador tiene la API (Chrome la expone con
  // prefijo webkit). Si no existe, supported = false y la interfaz avisa.
  const Recognition =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = !!Recognition

  const [listening, setListening] = useState(false) // ¿está escuchando?
  const [error, setError] = useState(null) // mensaje de error visible
  const recRef = useRef(null) // instancia del reconocedor
  // useRef guarda el callback sin provocar re-renders al cambiar.
  const onTextRef = useRef(onText)
  onTextRef.current = onText

  // Al desmontar el componente: cancelar cualquier dictado en curso.
  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort()
      } catch (_) {}
    }
  }, [])

  // Esta función ARRANCA el dictado (la llama el botón "Voz").
  async function start() {
    if (!supported || listening) return
    setError(null)

    // Paso 1: pedimos el micrófono explícitamente con getUserMedia.
    // Así el navegador muestra el aviso de permiso, y si falla sabemos
    // distinguir "sin permiso" de "no hay micrófono".
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

    // Paso 2: configuramos y arrancamos el reconocimiento de voz.
    const rec = new Recognition()
    rec.lang = lang // idioma: español
    rec.interimResults = true // resultados parciales mientras hablas
    rec.continuous = false // se detiene solo al callar
    rec.maxAlternatives = 1

    // AQUÍ llegan los resultados: se unen los trozos y se avisa al
    // componente con el texto y si ya es definitivo (isFinal).
    rec.onresult = (e) => {
      let txt = ''
      let isFinal = false
      for (let i = 0; i < e.results.length; i++) {
        txt += e.results[i][0].transcript
        if (e.results[i].isFinal) isFinal = true
      }
      onTextRef.current?.(txt, isFinal)
    }
    // AQUÍ llegan los errores: se traducen con el diccionario de arriba.
    rec.onerror = (e) => {
      const msg = ERROR_MESSAGES[e.error]
      if (msg !== null) setError(msg || `Error de dictado: ${e.error}`)
    }
    // Cuando el reconocimiento termina (por lo que sea), dejamos de escuchar.
    rec.onend = () => setListening(false)

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch (e) {
      setError('No se pudo iniciar el dictado: ' + (e?.message || e))
    }
  }

  // Esta función DETIENE el dictado manualmente.
  function stop() {
    try {
      recRef.current?.stop()
    } catch (_) {}
    setListening(false)
  }

  return { supported, listening, error, start, stop }
}
