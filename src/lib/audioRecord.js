// ============================================================================
// audioRecord.js — Grabación de micrófono (PREPARACIÓN PARA AMPLIACIÓN).
//
// No se usa en la versión actual. Es la base para el dictado local con IA
// (Whisper): graba el micrófono y convierte el audio a PCM mono de 16 kHz,
// el formato que espera ese modelo.
// ============================================================================

// Esta función crea un grabador sencillo sobre la API MediaRecorder.
// Devuelve un objeto con start() / stop() / cancel().
export function createRecorder() {
  let mediaRecorder = null
  let stream = null
  let chunks = [] // trozos de audio que va entregando el navegador

  return {
    // Pide el micrófono y empieza a grabar.
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start()
    },

    // Detiene la grabación y devuelve el audio completo como Blob.
    stop() {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          cleanup()
          reject(new Error('No hay grabación en curso'))
          return
        }
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
          cleanup()
          resolve(blob)
        }
        mediaRecorder.stop()
      })
    },

    // Cancela sin devolver audio (p. ej. al desmontar el componente).
    cancel() {
      try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
      } catch (_) {}
      cleanup()
    },
  }

  // Libera el micrófono (apaga la lucecita de "grabando" del navegador).
  function cleanup() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
    mediaRecorder = null
  }
}

// Esta función convierte el Blob grabado a PCM mono de 16 kHz (Float32Array).
// Pasos: decodificar el audio → re-muestrearlo con OfflineAudioContext.
export async function blobToPCM16k(blob) {
  const arrayBuffer = await blob.arrayBuffer()
  const AC = window.AudioContext || window.webkitAudioContext
  const ac = new AC()
  let decoded
  try {
    decoded = await ac.decodeAudioData(arrayBuffer) // audio comprimido → muestras
  } finally {
    ac.close().catch(() => {})
  }

  // Re-muestreo: se "reproduce" el audio dentro de un contexto offline a
  // 16000 Hz y 1 canal, y el resultado es el audio convertido.
  const targetRate = 16000
  const length = Math.max(1, Math.ceil(decoded.duration * targetRate))
  const oc = new OfflineAudioContext(1, length, targetRate)
  const source = oc.createBufferSource()
  source.buffer = decoded
  source.connect(oc.destination)
  source.start()
  const rendered = await oc.startRendering()
  return rendered.getChannelData(0) // canal único con las muestras
}
