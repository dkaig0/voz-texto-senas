// Gestión de usuarios con persistencia en localStorage.
// Seguridad: las contraseñas NUNCA se guardan en texto plano; se almacena
// un hash SHA-256 con "salt" aleatorio por usuario (Web Crypto API).

import { readJSON, writeJSON } from './storage.js'

const USERS_KEY = 'senas.usuarios'

// Valida la estructura guardada (integridad de datos).
function isUserArray(data) {
  return (
    Array.isArray(data) &&
    data.every(
      (u) =>
        u &&
        typeof u.id === 'string' &&
        typeof u.usuario === 'string' &&
        typeof u.nombre === 'string' &&
        typeof u.salt === 'string' &&
        typeof u.hash === 'string'
    )
  )
}

/* ------------------------- criptografía ------------------------- */

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}


/* Se crea Salt*/
function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password, salt) {
  return sha256Hex(`${salt}:${password}`)
}

/* ------------------------- validaciones ------------------------- */

const USERNAME_RE = /^[a-zA-Z0-9ñÑ._-]{3,20}$/

// Devuelve una lista de errores en español; vacía si todo es válido.
export function validateUserInput({ usuario, nombre, password }, { requirePassword = true } = {}) {
  const errors = []
  const u = (usuario || '').trim()
  const n = (nombre || '').trim()

  if (!u) errors.push('El nombre de usuario es obligatorio.')
  else if (!USERNAME_RE.test(u))
    errors.push('Usuario: 3 a 20 caracteres, solo letras, números, punto, guion o guion bajo (sin espacios).')

  if (n.length > 40) errors.push('El nombre no puede superar 40 caracteres.')

  if (requirePassword || password) {
    if (!password) errors.push('La contraseña es obligatoria.')
    else if (password.length < 6) errors.push('La contraseña debe tener al menos 6 caracteres.')
    else if (password.length > 30) errors.push('La contraseña no puede superar 30 caracteres.')
  }

  return errors
}

/* ------------------------- operaciones CRUD ------------------------- */

export function loadUsers() {
  return readJSON(USERS_KEY, [], isUserArray)
}

function saveUsers(users) {
  return writeJSON(USERS_KEY, users)
}

// Crea el usuario de demostración (test / test123) si no existe ninguno.
export async function seedDefaultUser() {
  const users = loadUsers()
  if (users.length === 0) {
    const salt = randomSalt()
    users.push({
      id: crypto.randomUUID(),
      usuario: 'test',
      nombre: 'Usuario de prueba',
      salt,
      hash: await hashPassword('test123', salt),
      creadoEl: new Date().toISOString(),
    })
    saveUsers(users)
  }
  return users
}

// CREATE — devuelve { ok, errors?, user? }
export async function createUser({ usuario, nombre, password }) {
  const errors = validateUserInput({ usuario, nombre, password })
  const users = loadUsers()
  const u = (usuario || '').trim()

  if (users.some((x) => x.usuario.toLowerCase() === u.toLowerCase()))
    errors.push('Ese nombre de usuario ya existe.')
  if (errors.length) return { ok: false, errors }

  const salt = randomSalt()
  const user = {
    id: crypto.randomUUID(),
    usuario: u,
    nombre: (nombre || '').trim(),
    salt,
    hash: await hashPassword(password, salt),
    creadoEl: new Date().toISOString(),
  }
  users.push(user)
  if (!saveUsers(users)) return { ok: false, errors: ['No se pudo guardar en localStorage.'] }
  return { ok: true, user }
}

// UPDATE — contraseña vacía = mantener la actual.
export async function updateUser(id, { usuario, nombre, password }) {
  const errors = validateUserInput({ usuario, nombre, password }, { requirePassword: false })
  const users = loadUsers()
  const index = users.findIndex((x) => x.id === id)
  const u = (usuario || '').trim()

  if (index === -1) return { ok: false, errors: ['El usuario ya no existe.'] }
  if (users.some((x) => x.id !== id && x.usuario.toLowerCase() === u.toLowerCase()))
    errors.push('Ese nombre de usuario ya existe.')
  if (errors.length) return { ok: false, errors }

  const updated = { ...users[index], usuario: u, nombre: (nombre || '').trim() }
  if (password) {
    updated.salt = randomSalt()
    updated.hash = await hashPassword(password, updated.salt)
  }
  users[index] = updated
  if (!saveUsers(users)) return { ok: false, errors: ['No se pudo guardar en localStorage.'] }
  return { ok: true, user: updated }
}

// DELETE
export function deleteUser(id) {
  const users = loadUsers()
  const next = users.filter((x) => x.id !== id)
  if (next.length === users.length) return { ok: false, errors: ['El usuario no existe.'] }
  if (!saveUsers(next)) return { ok: false, errors: ['No se pudo guardar en localStorage.'] }
  return { ok: true }
}

// Comprueba credenciales; devuelve el usuario o null.
export async function verifyCredentials(usuario, password) {
  const users = loadUsers()
  const u = users.find((x) => x.usuario.toLowerCase() === (usuario || '').trim().toLowerCase())
  if (!u) return null
  const hash = await hashPassword(password || '', u.salt)
  return hash === u.hash ? u : null
}
