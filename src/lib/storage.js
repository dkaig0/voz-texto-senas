// Lectura/escritura segura de JSON en localStorage.
// Si el dato está corrupto o no pasa la validación, se devuelve el valor
// por defecto en lugar de romper la app (integridad de datos).

export function readJSON(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const data = JSON.parse(raw)
    if (validate && !validate(data)) return fallback
    return data
  } catch (_) {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (_) {
    // localStorage lleno o bloqueado
    return false
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch (_) {}
}
