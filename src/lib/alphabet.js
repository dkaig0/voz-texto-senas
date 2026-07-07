// Abecedario dactilológico español (una mano).
// Usa el alfabeto manual internacional de una mano (SVG de dominio público,
// empaquetados localmente), que es la base del dactilológico español (LSE).
// La Ñ se representa como la N con un pequeño movimiento lateral (tilde).

// import.meta.glob importa los 26 SVG como URLs listas para usar en <img>.
const modules = import.meta.glob('../assets/asl/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

// Mapa { a: url, b: url, ... }
export const LETTERS = {}
for (const path in modules) {
  const m = path.match(/([a-z])\.svg$/i)
  if (m) LETTERS[m[1].toLowerCase()] = modules[path]
}

// Alfabeto español para la vista de referencia (con Ñ tras la N).
export const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz'.split('')

export function letterSrc(ch) {
  const c = (ch || '').toLowerCase()
  if (c === 'ñ') return LETTERS['n']
  return LETTERS[c] || null
}

// Quita acentos y pasa a minúscula: "á"->"a", "ü"->"u", etc.
function normalizeChar(ch) {
  return ch
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// Convierte un texto en pasos para el reproductor.
// Cada paso: { type: 'letter'|'space'|'other', char, display, src, tilde?, note? }
export function textToSteps(text) {
  const steps = []
  for (const raw of [...(text || '')]) {
    if (/\s/.test(raw)) {
      steps.push({ type: 'space', display: ' ' })
      continue
    }
    const lower = raw.toLowerCase()
    // Ñ: letra propia del español — misma mano que la N, con movimiento.
    if (lower === 'ñ') {
      steps.push({
        type: 'letter',
        char: 'ñ',
        display: raw,
        src: LETTERS['n'],
        tilde: true,
        note: 'como la N, con un pequeño movimiento lateral',
      })
      continue
    }
    const n = normalizeChar(raw)
    if (n.length === 1 && n >= 'a' && n <= 'z') {
      steps.push({ type: 'letter', char: n, display: raw, src: LETTERS[n] })
    } else {
      // Números, signos de puntuación… no tienen seña en este abecedario.
      steps.push({ type: 'other', display: raw })
    }
  }
  return steps
}
