import { useState } from 'react'
import { verifyCredentials } from '../lib/users.js'

// Pantalla de inicio de sesión. Valida credenciales contra localStorage.
export default function LoginForm({ onLogin }) {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!usuario.trim() || !password) {
      setError('Ingresa usuario y contraseña.')
      return
    }

    setChecking(true)
    try {
      const user = await verifyCredentials(usuario, password)
      if (!user) {
        setError('Usuario o contraseña incorrectos.')
        return
      }
      onLogin(user)
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="gate">
      <div className="gate-card">
        <h1>Voz y Texto a Señas</h1>
        <p className="gate-lead">
          Inicia sesión para usar el traductor y gestionar usuarios.
        </p>

        <form onSubmit={handleSubmit} className="gate-form">
          <label htmlFor="login-user">Usuario</label>
          <input
            id="login-user"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            maxLength={20}
          />

          <label htmlFor="login-pass">Contraseña</label>
          <input
            id="login-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={30}
          />

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={checking}>
            {checking ? 'Comprobando…' : 'Entrar'}
          </button>
        </form>

        <p className="gate-help">
          Cuenta de demostración: usuario <code>test</code> · contraseña{' '}
          <code>test123</code>
        </p>
        <p className="gate-note">
          Los datos se guardan en tu navegador (localStorage) con la contraseña
          cifrada (SHA-256 + salt).
        </p>
      </div>
    </div>
  )
}
