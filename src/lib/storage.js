// ============================================================================
// storage.js — Acceso SEGURO a localStorage (capa de persistencia).
//
// Todo lo que la app guarda o lee de localStorage pasa por aquí. Objetivo:
// que un dato corrupto o manipulado NUNCA rompa la aplicación (integridad).
// ============================================================================

// Esta función lee y parsea un JSON de localStorage de forma protegida.
//   - key:      clave de localStorage (ej: 'senas.usuarios')
//   - fallback: valor por defecto si algo falla (ej: lista vacía [])
//   - validate: función opcional que revisa la ESTRUCTURA del dato
// Si el dato no existe, el JSON está corrupto, o no pasa la validación,
// devuelve el fallback en lugar de lanzar un error.
export function readJSON(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback // no existe la clave
    const data = JSON.parse(raw) // puede lanzar error si está corrupto
    if (validate && !validate(data)) return fallback // estructura inválida
    return data
  } catch (_) {
    // JSON.parse falló (dato corrupto/manipulado) → valor por defecto.
    return fallback
  }
}

// Esta función guarda cualquier valor como JSON en localStorage.
// Devuelve true/false para que quien llama sepa si se guardó bien.
export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (_) {
    // localStorage lleno o bloqueado por el navegador.
    return false
  }
}

// Esta función elimina una clave (se usa al cerrar sesión).
export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch (_) {}
}
