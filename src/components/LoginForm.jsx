// ============================================================================
// LoginForm.jsx — PANTALLA DE INICIO DE SESIÓN.
// Formulario controlado que valida credenciales contra localStorage.
// Si las credenciales son correctas, avisa al padre (App) con onLogin(user).
// ============================================================================

import { useState } from 'react'
import { verifyCredentials } from '../lib/users.js'

export default function LoginForm({ onLogin }) {
  // Formulario "controlado": cada input vive en un estado de React.
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null) // mensaje de error visible
  const [checking, setChecking] = useState(false) // true mientras se comprueba

  // Esta función se ejecuta al enviar el formulario (botón Entrar o tecla Enter).
  async function handleSubmit(e) {
    e.preventDefault() // evita que el navegador recargue la página
    setError(null)

    // Validación: no comprobar nada si falta algún campo.
    if (!usuario.trim() || !password) {
      setError('Ingresa usuario y contraseña.')
      return
    }

    setChecking(true)
    try {
      // AQUÍ se validan las credenciales (recalcula el hash y compara).
      const user = await verifyCredentials(usuario, password)
      if (!user) {
        // Mensaje genérico a propósito: no revelamos si falló el usuario
        // o la contraseña (buena práctica de seguridad).
        setError('Usuario o contraseña incorrectos.')
        return
      }
      onLogin(user) // avisa a App para crear la sesión
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
            type="password" /* oculta lo escrito */
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            maxLength={30}
          />

          {/* El error solo se pinta si existe */}
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
