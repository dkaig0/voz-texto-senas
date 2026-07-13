// ============================================================================
// UsersMode.jsx — MODO USUARIOS: interfaz del CRUD completo.
// Create y Update comparten el mismo formulario; Read carga la lista al
// entrar; Delete pide confirmación en dos pasos.
// ============================================================================

import { useEffect, useState } from 'react'
import {
  loadUsers,
  createUser,
  updateUser,
  deleteUser,
  // randomLegoFoto,
} from '../lib/users.js'

// Estado inicial del formulario (vacío).
const EMPTY_FORM = { usuario: '', nombre: '', password: '' /* , foto: '' */ }

export default function UsersMode({ session, onSessionUserChange }) {
  const [users, setUsers] = useState([]) // lista de usuarios (Read)
  const [form, setForm] = useState(EMPTY_FORM) // campos del formulario
  const [editingId, setEditingId] = useState(null) // null = creando; id = editando
  const [errors, setErrors] = useState([]) // errores de validación visibles
  const [notice, setNotice] = useState(null) // aviso verde de éxito
  const [confirmDeleteId, setConfirmDeleteId] = useState(null) // 1er clic de eliminar
  // const [apiLoading, setApiLoading] = useState(false) // true mientras consulta la API

  // READ — useEffect con [] : al entrar a la pestaña se carga la lista
  // desde localStorage (con validación de estructura incluida).
  useEffect(() => {
    setUsers(loadUsers())
  }, [])

  // Esta función actualiza UN campo del formulario sin tocar el resto.
  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Esta función deja el formulario en modo "crear" (limpio).
  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors([])
    setNotice(null)
  }

  // Esta función pasa el formulario a modo "editar": precarga los datos
  // del usuario elegido (la contraseña se deja vacía = no cambiarla).
  function startEdit(user) {
    setEditingId(user.id)
    setForm({ usuario: user.usuario, nombre: user.nombre, password: '' /* , foto: user.foto || '' */ })
    setErrors([])
    setNotice(null)
    setConfirmDeleteId(null)
  }

  // CREATE / UPDATE — Esta función se ejecuta al enviar el formulario.
  // Según editingId decide si crea o actualiza. La validación vive en
  // users.js; aquí solo se muestran los errores que devuelva.
  async function handleSubmit(e) {
    e.preventDefault() // que el navegador no recargue la página
    setErrors([])
    setNotice(null)

    const result = editingId
      ? await updateUser(editingId, form) // UPDATE
      : await createUser(form) // CREATE

    if (!result.ok) {
      setErrors(result.errors) // se pintan bajo el formulario
      return
    }

    setUsers(loadUsers()) // recargar la lista ya persistida
    setNotice(editingId ? 'Usuario actualizado.' : `Usuario “${result.user.usuario}” creado.`)

    // Si edité mi propio usuario, aviso a App para refrescar la sesión.
    if (editingId && session && editingId === session.id) {
      onSessionUserChange?.(result.user)
    }

    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  // DELETE — con confirmación en dos pasos: el primer clic "arma" el botón
  // (¿Seguro?), el segundo clic elimina de verdad.
  function handleDelete(user) {
    if (confirmDeleteId !== user.id) {
      setConfirmDeleteId(user.id) // primer clic: pedir confirmación
      return
    }
    const result = deleteUser(user.id) // segundo clic: eliminar
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setUsers(loadUsers())
    setNotice(`Usuario “${user.usuario}” eliminado.`)
    setConfirmDeleteId(null)
    if (editingId === user.id) startCreate()
  }

  // API EXTERNA — Esta función consume randomuser.me para proponer un
  // usuario nuevo. La respuesta rellena el formulario y pasa por las
  // MISMAS validaciones que un usuario escrito a mano.
  /*
  async function handleGenerateFromApi() {
    setApiLoading(true)
    setErrors([])
    setNotice(null)
    try {
      // fetch + await: petición HTTP GET a la API (nat=es → nombres españoles).
      const res = await fetch('https://randomuser.me/api/?nat=es&inc=name,login&noinfo')
      if (!res.ok) throw new Error(`la API respondió HTTP ${res.status}`)
      const data = await res.json()
      const r = data?.results?.[0]
      if (!r?.login?.username) throw new Error('respuesta inesperada de la API')

      // SANEO de datos externos (nunca confiar a ciegas en una API):
      // se eliminan caracteres no permitidos y se recorta el largo.
      const usuario = r.login.username.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20)
      const nombre = [r.name?.first, r.name?.last].filter(Boolean).join(' ').slice(0, 40)

      // Si la contraseña que propone la API no cumple nuestras reglas,
      // se genera una segura localmente (aleatoria).
      let password = r.login.password || ''
      if (password.length < 6 || password.length > 30) {
        const bytes = crypto.getRandomValues(new Uint8Array(4))
        password = 'Api-' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
      }

      // Se rellena el formulario con lo saneado + una foto LEGO al azar.
      setEditingId(null)
      setForm({ usuario, nombre, password, foto: randomLegoFoto() })
      setNotice(
        `Datos traídos de randomuser.me — contraseña propuesta: “${password}”. Revisa y pulsa “Crear usuario”.`
      )
    } catch (e) {
      // Manejo de errores: sin internet o API caída → mensaje claro.
      setErrors([
        `No se pudo consultar randomuser.me (${e?.message || e}). Revisa tu conexión a internet.`,
      ])
    } finally {
      setApiLoading(false) // pase lo que pase, el botón vuelve a activarse
    }
  }
  */

  // Esta función da formato legible a la fecha de creación.
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    } catch (_) {
      return '—'
    }
  }

  return (
    <div className="users">
      {/* ------------------- PANEL IZQUIERDO: formulario ------------------- */}
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">
            {editingId ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          {/* Botón de la API externa (solo en modo crear)
          {!editingId && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleGenerateFromApi}
              disabled={apiLoading}
              title="Trae nombre y usuario desde la API externa randomuser.me"
            >
              {apiLoading ? 'Consultando API…' : 'Generar con API'}
            </button>
          )}
          */}
        </div>

        <form onSubmit={handleSubmit} className="user-form" noValidate>
          <div className="field">
            <label htmlFor="u-usuario">Usuario *</label>
            <input
              id="u-usuario"
              type="text"
              value={form.usuario}
              onChange={(e) => setField('usuario', e.target.value)}
              maxLength={20}
              placeholder="ej: maria.perez"
            />
          </div>

          <div className="field">
            <label htmlFor="u-nombre">Nombre</label>
            <input
              id="u-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              maxLength={40}
              placeholder="ej: María Pérez"
            />
          </div>

          <div className="field">
            <label htmlFor="u-pass">
              Contraseña {editingId ? '(vacía = no cambiar)' : '*'}
            </label>
            <input
              id="u-pass"
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              maxLength={30}
              autoComplete="new-password"
              placeholder="mínimo 6 caracteres"
            />
          </div>

          {/* Vista previa de la foto LEGO propuesta por la API
          {form.foto && (
            <div className="avatar-preview-row">
              <img className="avatar-preview" src={form.foto} alt="Foto de perfil propuesta" />
              <span className="user-meta">Foto de perfil (set LEGO de randomuser.me)</span>
            </div>
          )}
          */}

          {/* Errores de validación (lista roja) y aviso de éxito (verde) */}
          {errors.length > 0 && (
            <ul className="form-errors">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
          {notice && <p className="form-notice">{notice}</p>}

          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            {editingId && (
              <button className="btn btn-ghost" type="button" onClick={startCreate}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>

        <p className="hint">
          Las contraseñas se guardan cifradas (SHA-256 + salt), nunca en texto
          plano.
        </p>
      </section>

      {/* ------------------- PANEL DERECHO: lista (Read) ------------------- */}
      <section className="panel">
        <h2 className="panel-title">Usuarios registrados ({users.length})</h2>

        {users.length === 0 ? (
          <p className="hint">No hay usuarios. Crea el primero con el formulario.</p>
        ) : (
          <ul className="user-list">
            {users.map((u) => (
              <li key={u.id} className={'user-row' + (u.id === editingId ? ' editing' : '')}>
                {/* Avatar: foto LEGO si tiene; si no, la inicial del usuario
                {u.foto ? (
                  <img className="user-avatar" src={u.foto} alt="" loading="lazy" />
                ) : (
                  <span className="user-avatar fallback" aria-hidden="true">
                    {u.usuario[0].toUpperCase()}
                  </span>
                )}
                */}
                <span className="user-avatar fallback" aria-hidden="true">
                  {u.usuario[0].toUpperCase()}
                </span>
                <div className="user-info">
                  <strong>
                    {u.usuario}
                    {/* Etiqueta "tú" en el usuario de la sesión activa */}
                    {session && u.id === session.id && (
                      <span className="badge-me">tú</span>
                    )}
                  </strong>
                  <span className="user-meta">
                    {u.nombre || 'Sin nombre'} · creado el {formatDate(u.creadoEl)}
                  </span>
                </div>
                <div className="user-actions">
                  <button className="btn btn-ghost" onClick={() => startEdit(u)}>
                    Editar
                  </button>
                  {/* No se puede eliminar el usuario con sesión iniciada */}
                  {session && u.id === session.id ? (
                    <span className="user-meta" title="No puedes eliminar tu propia sesión">
                      —
                    </span>
                  ) : (
                    <button
                      className={'btn btn-danger' + (confirmDeleteId === u.id ? ' arm' : '')}
                      onClick={() => handleDelete(u)}
                      onBlur={() => setConfirmDeleteId(null)}
                    >
                      {confirmDeleteId === u.id ? '¿Seguro? Sí, eliminar' : 'Eliminar'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
