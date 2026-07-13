// ============================================================================
// App.jsx — COMPONENTE RAÍZ de la aplicación.
// Responsabilidades: 1) la sesión (login/logout), 2) crear el usuario demo
// al arrancar, 3) la navegación entre los tres modos.
// ============================================================================

import { useEffect, useState } from 'react'
import TranslatorMode from './components/TranslatorMode.jsx'
import AlphabetMode from './components/AlphabetMode.jsx'
import UsersMode from './components/UsersMode.jsx'
import LoginForm from './components/LoginForm.jsx'
import { seedDefaultUser } from './lib/users.js'
import { readJSON, writeJSON, removeKey } from './lib/storage.js'

// Clave de localStorage donde se guarda la sesión activa.
const SESSION_KEY = 'senas.sesion'

// Las tres pestañas de la app (id interno + etiqueta visible).
const MODES = [
  { id: 'translate', label: 'Traductor' },
  { id: 'alphabet', label: 'Abecedario' },
  { id: 'users', label: 'Usuarios' },
]

// Validador de la sesión guardada. Seguridad: la sesión SOLO contiene datos
// no sensibles (id, usuario, nombre) — nunca contraseñas ni hashes.
const isSession = (d) =>
  d && typeof d.id === 'string' && typeof d.usuario === 'string'

export default function App() {
  // Estado: pestaña activa.
  const [mode, setMode] = useState('translate')
  // Estado: false hasta que exista el usuario demo (evita parpadeos).
  const [ready, setReady] = useState(false)
  // Estado: sesión actual. Se inicializa leyendo localStorage de forma
  // segura (si está corrupta → null → pantalla de login).
  const [session, setSession] = useState(() => readJSON(SESSION_KEY, null, isSession))

  // useEffect con [] = se ejecuta UNA vez al montar la app.
  // AQUÍ se garantiza que exista el usuario demo (test / test123).
  useEffect(() => {
    seedDefaultUser().finally(() => setReady(true))
  }, [])

  // Esta función guarda la sesión al iniciar sesión (solo datos no sensibles).
  function handleLogin(user) {
    const s = { id: user.id, usuario: user.usuario, nombre: user.nombre }
    writeJSON(SESSION_KEY, s)
    setSession(s)
  }

  // Esta función cierra la sesión: borra localStorage y vuelve al login.
  function handleLogout() {
    removeKey(SESSION_KEY)
    setSession(null)
    setMode('translate')
  }

  // Si en el CRUD edito MI PROPIO usuario, refresco la sesión visible.
  function handleSessionUserChange(user) {
    handleLogin(user)
  }

  // Mientras se crea el usuario demo no se pinta nada (es instantáneo).
  if (!ready) return null

  // Sin sesión → solo se muestra el formulario de login.
  if (!session) return <LoginForm onLogin={handleLogin} />

  // Con sesión → la aplicación completa.
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark"></span>
          <div>
            <h1>Voz y Texto a Señas</h1>
            <p className="brand-sub">Abecedario dactilológico español</p>
          </div>
        </div>

        {/* Navegación: un botón por modo; el activo se resalta con CSS */}
        <nav className="nav">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={'nav-btn' + (mode === m.id ? ' active' : '')}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </nav>

        {/* Sesión activa: nombre del usuario + botón salir */}
        <div className="session-box">
          <span className="session-user">{session.nombre || session.usuario}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <div className="info-banner">
        Escribe o habla en español y la app lo convierte a <strong>señas</strong>,
        deletreando con el abecedario dactilológico (27 letras, con Ñ). Funciona
        sin conexión (la voz necesita Chrome/Edge). Sin claves ni servidores.
      </div>

      {/* Renderizado condicional: solo se monta el modo seleccionado */}
      <main className="container">
        {mode === 'translate' && <TranslatorMode />}
        {mode === 'alphabet' && <AlphabetMode />}
        {mode === 'users' && (
          <UsersMode session={session} onSessionUserChange={handleSessionUserChange} />
        )}
      </main>

      <footer className="app-footer">
        <span>
          Alfabeto manual de una mano (base del dactilológico español) — imágenes
          de dominio público (wpclipart.com vía Wikimedia Commons).
        </span>
        <span>Hecho con React + Vite</span>
      </footer>
    </div>
  )
}
