// ============================================================================
// users.js — EL ARCHIVO CENTRAL DE LA EVALUACIÓN.
// CRUD de usuarios con persistencia en localStorage + seguridad.
//
// Seguridad: las contraseñas NUNCA se guardan en texto plano; se almacena
// un hash SHA-256 con "salt" aleatorio por usuario (Web Crypto API).
// ============================================================================

import { readJSON, writeJSON } from './storage.js'

// Clave de localStorage donde vive la lista de usuarios.
const USERS_KEY = 'senas.usuarios'

// Esta función valida la ESTRUCTURA de lo guardado (integridad de datos):
// debe ser una lista y cada usuario debe tener sus campos con el tipo
// correcto. Si alguien manipula localStorage, esto lo detecta.
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

// Esta función calcula el hash SHA-256 de un texto usando la Web Crypto API
// del navegador y lo devuelve en hexadecimal. Un hash es de "una sola vía":
// del resultado NO se puede recuperar el texto original.
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text) // texto → bytes
  const digest = await crypto.subtle.digest('SHA-256', bytes) // bytes → hash
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/* Se crea Salt*/
// Esta función genera el "salt": 16 bytes ALEATORIOS únicos por usuario.
// Sirve para que dos personas con la misma contraseña tengan hashes
// distintos, y anula las tablas de hashes precalculados (rainbow tables).
function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Esta función combina salt + contraseña y devuelve su hash.
// Es lo ÚNICO que se guarda de la contraseña: SHA-256("salt:contraseña").
export async function hashPassword(password, salt) {
  return sha256Hex(`${salt}:${password}`)
}

/* ------------------------- foto de perfil ------------------------- */
/*
// Patrón exacto de las fotos LEGO de randomuser.me (existen índices 0 a 9).
const LEGO_FOTO_RE = /^https:\/\/randomuser\.me\/api\/portraits\/lego\/\d\.jpg$/

// Esta función elige una foto LEGO al azar para el usuario nuevo.
export function randomLegoFoto() {
  return `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`
}

// Esta función SANEA la foto: solo acepta URLs que sean exactamente del set
// LEGO de randomuser.me; cualquier otra URL se descarta y se reemplaza.
// (Principio de seguridad: no confiar en datos externos sin validar.)
function safeFoto(foto) {
  return LEGO_FOTO_RE.test(foto || '') ? foto : randomLegoFoto()
}
*/

/* ------------------------- validaciones ------------------------- */

// Regla del nombre de usuario: 3 a 20 caracteres, letras/números/punto/
// guion/guion bajo. Sin espacios ni símbolos raros.
const USERNAME_RE = /^[a-zA-Z0-9ñÑ._-]{3,20}$/

// Esta función valida el formulario de usuario y devuelve la LISTA de
// errores en español (vacía si todo está bien).
// requirePassword=false se usa al EDITAR (contraseña vacía = no cambiarla).
export function validateUserInput({ usuario, nombre, password }, { requirePassword = true } = {}) {
  const errors = []
  const u = (usuario || '').trim() // trim() quita espacios de los extremos
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

// READ — Esta función lee la lista de usuarios desde localStorage.
// Pasa por readJSON con el validador: si el dato está corrupto → [].
export function loadUsers() {
  return readJSON(USERS_KEY, [], isUserArray)
}

// Esta función guarda la lista completa en localStorage.
function saveUsers(users) {
  return writeJSON(USERS_KEY, users)
}

// Esta función crea el usuario de demostración (test / test123) si no
// existe ninguno. Se llama una vez al arrancar la app (desde App.jsx).
// Ojo: la contraseña demo también se guarda con hash, nunca en claro.
export async function seedDefaultUser() {
  const users = loadUsers()
  if (users.length === 0) {
    const salt = randomSalt()
    users.push({
      id: crypto.randomUUID(), // identificador único
      usuario: 'test',
      nombre: 'Usuario de prueba',
      // foto: randomLegoFoto(),
      salt,
      hash: await hashPassword('test123', salt),
      creadoEl: new Date().toISOString(), // fecha de creación
    })
    saveUsers(users)
  }
  return users
}

// CREATE — Esta función crea un usuario nuevo.
// Pasos: 1) validar campos, 2) rechazar duplicados, 3) generar salt+hash,
// 4) guardar. Devuelve { ok, errors?, user? }.
export async function createUser({ usuario, nombre, password /* , foto */ }) {
  const errors = validateUserInput({ usuario, nombre, password })
  const users = loadUsers()
  const u = (usuario || '').trim()

  // Duplicados: se compara en minúsculas ("Maria" y "maria" son el mismo).
  if (users.some((x) => x.usuario.toLowerCase() === u.toLowerCase()))
    errors.push('Ese nombre de usuario ya existe.')
  if (errors.length) return { ok: false, errors }

  const salt = randomSalt()
  const user = {
    id: crypto.randomUUID(),
    usuario: u,
    nombre: (nombre || '').trim(),
    // foto: safeFoto(foto), // foto validada (o una LEGO aleatoria)
    salt,
    hash: await hashPassword(password, salt),
    creadoEl: new Date().toISOString(),
  }
  users.push(user)
  if (!saveUsers(users)) return { ok: false, errors: ['No se pudo guardar en localStorage.'] }
  return { ok: true, user }
}

// UPDATE — Esta función edita un usuario existente por su id.
// Si la contraseña llega vacía se MANTIENE la actual; si llega una nueva,
// se genera salt nuevo y hash nuevo.
export async function updateUser(id, { usuario, nombre, password }) {
  const errors = validateUserInput({ usuario, nombre, password }, { requirePassword: false })
  const users = loadUsers()
  const index = users.findIndex((x) => x.id === id)
  const u = (usuario || '').trim()

  if (index === -1) return { ok: false, errors: ['El usuario ya no existe.'] }
  // El nuevo nombre no puede chocar con OTRO usuario (x.id !== id).
  if (users.some((x) => x.id !== id && x.usuario.toLowerCase() === u.toLowerCase()))
    errors.push('Ese nombre de usuario ya existe.')
  if (errors.length) return { ok: false, errors }

  // {...users[index]} copia el usuario y se sobreescriben los campos editados.
  const updated = { ...users[index], usuario: u, nombre: (nombre || '').trim() }
  if (password) {
    updated.salt = randomSalt()
    updated.hash = await hashPassword(password, updated.salt)
  }
  users[index] = updated
  if (!saveUsers(users)) return { ok: false, errors: ['No se pudo guardar en localStorage.'] }
  return { ok: true, user: updated }
}

// DELETE — Esta función elimina un usuario por su id.
// filter() crea la lista SIN ese usuario; si el tamaño no cambió, no existía.
export function deleteUser(id) {
  const users = loadUsers()
  const next = users.filter((x) => x.id !== id)
  if (next.length === users.length) return { ok: false, errors: ['El usuario no existe.'] }
  if (!saveUsers(next)) return { ok: false, errors: ['No se pudo guardar en localStorage.'] }
  return { ok: true }
}

// LOGIN — Esta función comprueba las credenciales.
// Busca el usuario, recalcula el hash con la contraseña escrita + el salt
// GUARDADO, y compara con el hash guardado. Si coinciden → la contraseña
// era correcta (sin haberla almacenado nunca). Devuelve el usuario o null.
export async function verifyCredentials(usuario, password) {
  const users = loadUsers()
  const u = users.find((x) => x.usuario.toLowerCase() === (usuario || '').trim().toLowerCase())
  if (!u) return null
  const hash = await hashPassword(password || '', u.salt)
  return hash === u.hash ? u : null
}
