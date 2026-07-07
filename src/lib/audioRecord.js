// Grabación de micrófono y conversión a PCM mono de 16 kHz (Float32Array),
// que es el formato que espera Whisper.

// Crea un grabador sencillo sobre MediaRecorder.
export function createRecorder() {
  let mediaRecorder = null
  let stream = null
  let chunks = []

  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start()
    },

    // Detiene y devuelve el audio grabado como Blob.
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

  function cleanup() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
    mediaRecorder = null
  }
}

// Decodifica un Blob de audio y lo re-muestrea a mono 16 kHz.
export async function blobToPCM16k(blob) {
  const arrayBuffer = await blob.arrayBuffer()
  const AC = window.AudioContext || window.webkitAudioContext
  const ac = new AC()
  let decoded
  try {
    decoded = await ac.decodeAudioData(arrayBuffer)
  } finally {
    ac.close().catch(() => {})
  }

  const targetRate = 16000
  const length = Math.max(1, Math.ceil(decoded.duration * targetRate))
  const oc = new OfflineAudioContext(1, length, targetRate)
  const source = oc.createBufferSource()
  source.buffer = decoded
  source.connect(oc.destination)
  source.start()
  const rendered = await oc.startRendering()
  return rendered.getChannelData(0)
}
