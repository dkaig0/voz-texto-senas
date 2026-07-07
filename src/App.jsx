import { useEffect, useState } from 'react'
import TranslatorMode from './components/TranslatorMode.jsx'
import AlphabetMode from './components/AlphabetMode.jsx'
import UsersMode from './components/UsersMode.jsx'
import LoginForm from './components/LoginForm.jsx'
import { seedDefaultUser } from './lib/users.js'
import { readJSON, writeJSON, removeKey } from './lib/storage.js'

const SESSION_KEY = 'senas.sesion'

const MODES = [
  { id: 'translate', label: 'Traductor' },
  { id: 'alphabet', label: 'Abecedario' },
  { id: 'users', label: 'Usuarios' },
]

// Solo datos NO sensibles en la sesión (nunca contraseñas ni hashes).
const isSession = (d) =>
  d && typeof d.id === 'string' && typeof d.usuario === 'string'

export default function App() {
  const [mode, setMode] = useState('translate')
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState(() => readJSON(SESSION_KEY, null, isSession))

  // Al arrancar: garantiza que exista el usuario demo (test / test123).
  useEffect(() => {
    seedDefaultUser().finally(() => setReady(true))
  }, [])

  function handleLogin(user) {
    const s = { id: user.id, usuario: user.usuario, nombre: user.nombre }
    writeJSON(SESSION_KEY, s)
    setSession(s)
  }

  function handleLogout() {
    removeKey(SESSION_KEY)
    setSession(null)
    setMode('translate')
  }

  // Si edito mi propio usuario en el CRUD, la sesión se actualiza.
  function handleSessionUserChange(user) {
    handleLogin(user)
  }

  if (!ready) return null

  if (!session) return <LoginForm onLogin={handleLogin} />

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
