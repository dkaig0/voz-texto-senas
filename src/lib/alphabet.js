// ============================================================================
// alphabet.js — Convierte texto en una secuencia de señas del abecedario
// dactilológico español (una mano).
//
// Usa el alfabeto manual internacional de una mano (SVG de dominio público,
// empaquetados localmente), que es la base del dactilológico español (LSE).
// La Ñ se representa como la N con un pequeño movimiento lateral (tilde).
// ============================================================================

// AQUÍ se cargan las 26 imágenes SVG en tiempo de build (función de Vite).
// import.meta.glob busca todos los .svg de la carpeta y devuelve sus URLs
// listas para usar en <img src=...>. No hay peticiones de red en ejecución.
const modules = import.meta.glob('../assets/asl/*.svg', {
  eager: true, // eager = importar ya mismo (no bajo demanda)
  query: '?url', // queremos la URL del archivo, no su contenido
  import: 'default',
})

// AQUÍ se construye el mapa letra → imagen: { a: 'url', b: 'url', ... }
// Se extrae la letra del nombre del archivo (ej: ".../a.svg" → "a").
export const LETTERS = {}
for (const path in modules) {
  const m = path.match(/([a-z])\.svg$/i)
  if (m) LETTERS[m[1].toLowerCase()] = modules[path]
}

// AQUÍ está el alfabeto español completo (27 letras, con Ñ tras la N).
// Lo usa la vista "Abecedario" para pintar las tarjetas en orden.
export const ALPHABET = 'abcdefghijklmnñopqrstuvwxyz'.split('')

// Esta función devuelve la imagen que corresponde a una letra.
// La Ñ no tiene SVG propio: reutiliza la imagen de la N (la tilde se añade
// por CSS en el componente).
export function letterSrc(ch) {
  const c = (ch || '').toLowerCase()
  if (c === 'ñ') return LETTERS['n']
  return LETTERS[c] || null
}

// Esta función normaliza un carácter: pasa a minúscula y quita los acentos.
// normalize('NFD') separa la letra de su tilde ("á" → "a" + tilde) y la
// regex borra la tilde. Así "á"→"a", "ü"→"u" (las tildes no se signan).
function normalizeChar(ch) {
  return ch
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

// FUNCIÓN PRINCIPAL DEL ARCHIVO.
// Convierte un texto completo en la lista de "pasos" que consume SignPlayer.
// Cada paso es un objeto:
//   { type: 'letter' | 'space' | 'other', char, display, src, tilde?, note? }
//   - letter: letra con seña (src = imagen a mostrar)
//   - space:  espacio entre palabras (pausa visual)
//   - other:  carácter sin seña (números, signos...)
export function textToSteps(text) {
  const steps = []
  // [...(text)] recorre el texto carácter a carácter (soporta acentos/ñ).
  for (const raw of [...(text || '')]) {
    // Caso 1: espacios en blanco → paso de tipo "space".
    if (/\s/.test(raw)) {
      steps.push({ type: 'space', display: ' ' })
      continue
    }
    const lower = raw.toLowerCase()
    // Caso 2: la Ñ, letra propia del español. Usa la mano de la N con
    // tilde:true (para la animación) y una nota explicativa.
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
    // Caso 3: letras normales (a-z tras quitar acentos) → seña con imagen.
    const n = normalizeChar(raw)
    if (n.length === 1 && n >= 'a' && n <= 'z') {
      steps.push({ type: 'letter', char: n, display: raw, src: LETTERS[n] })
    } else {
      // Caso 4: números, signos de puntuación… no tienen seña en este
      // abecedario; se muestran como "sin seña".
      steps.push({ type: 'other', display: raw })
    }
  }
  return steps
}
