import { useEffect, useState } from 'react'
import {
  loadUsers,
  createUser,
  updateUser,
  deleteUser,
  randomLegoFoto,
} from '../lib/users.js'

const EMPTY_FORM = { usuario: '', nombre: '', password: '', foto: '' }

// Modo Usuarios: CRUD completo (crear, leer, actualizar, eliminar) sobre
// localStorage, con validaciones. `session` es el usuario con sesión activa.
export default function UsersMode({ session, onSessionUserChange }) {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState([])
  const [notice, setNotice] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [apiLoading, setApiLoading] = useState(false)

  // READ: carga inicial desde localStorage.
  useEffect(() => {
    setUsers(loadUsers())
  }, [])

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setErrors([])
    setNotice(null)
  }

  function startEdit(user) {
    setEditingId(user.id)
    setForm({ usuario: user.usuario, nombre: user.nombre, password: '', foto: user.foto || '' })
    setErrors([])
    setNotice(null)
    setConfirmDeleteId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors([])
    setNotice(null)

    const result = editingId
      ? await updateUser(editingId, form) // UPDATE
      : await createUser(form) // CREATE

    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    setUsers(loadUsers())
    setNotice(editingId ? 'Usuario actualizado.' : `Usuario “${result.user.usuario}” creado.`)

    // Si edité mi propio usuario, actualizo la sesión visible.
    if (editingId && session && editingId === session.id) {
      onSessionUserChange?.(result.user)
    }

    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  // DELETE (con confirmación en dos pasos).
  function handleDelete(user) {
    if (confirmDeleteId !== user.id) {
      setConfirmDeleteId(user.id)
      return
    }
    const result = deleteUser(user.id)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setUsers(loadUsers())
    setNotice(`Usuario “${user.usuario}” eliminado.`)
    setConfirmDeleteId(null)
    if (editingId === user.id) startCreate()
  }

  // Consume la API externa randomuser.me para proponer un usuario nuevo.
  // La respuesta rellena el formulario y pasa por las MISMAS validaciones
  // que un usuario escrito a mano.
  async function handleGenerateFromApi() {
    setApiLoading(true)
    setErrors([])
    setNotice(null)
    try {
      const res = await fetch('https://randomuser.me/api/?nat=es&inc=name,login&noinfo')
      if (!res.ok) throw new Error(`la API respondió HTTP ${res.status}`)
      const data = await res.json()
      const r = data?.results?.[0]
      if (!r?.login?.username) throw new Error('respuesta inesperada de la API')

      // Saneamos los datos externos antes de usarlos (nunca confiar a ciegas).
      const usuario = r.login.username.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20)
      const nombre = [r.name?.first, r.name?.last].filter(Boolean).join(' ').slice(0, 40)

      // Si la contraseña generada no cumple nuestras reglas, creamos una segura.
      let password = r.login.password || ''
      if (password.length < 6 || password.length > 30) {
        const bytes = crypto.getRandomValues(new Uint8Array(4))
        password = 'Api-' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
      }

      setEditingId(null)
      setForm({ usuario, nombre, password, foto: randomLegoFoto() })
      setNotice(
        `Datos traídos de randomuser.me — contraseña propuesta: “${password}”. Revisa y pulsa “Crear usuario”.`
      )
    } catch (e) {
      setErrors([
        `No se pudo consultar randomuser.me (${e?.message || e}). Revisa tu conexión a internet.`,
      ])
    } finally {
      setApiLoading(false)
    }
  }

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
      <section className="panel">
        <div className="panel-head">
          <h2 className="panel-title">
            {editingId ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
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

          {form.foto && (
            <div className="avatar-preview-row">
              <img className="avatar-preview" src={form.foto} alt="Foto de perfil propuesta" />
              <span className="user-meta">Foto de perfil (set LEGO de randomuser.me)</span>
            </div>
          )}

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

      <section className="panel">
        <h2 className="panel-title">Usuarios registrados ({users.length})</h2>

        {users.length === 0 ? (
          <p className="hint">No hay usuarios. Crea el primero con el formulario.</p>
        ) : (
          <ul className="user-list">
            {users.map((u) => (
              <li key={u.id} className={'user-row' + (u.id === editingId ? ' editing' : '')}>
                {u.foto ? (
                  <img className="user-avatar" src={u.foto} alt="" loading="lazy" />
                ) : (
                  <span className="user-avatar fallback" aria-hidden="true">
                    {u.usuario[0].toUpperCase()}
                  </span>
                )}
                <div className="user-info">
                  <strong>
                    {u.usuario}
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
