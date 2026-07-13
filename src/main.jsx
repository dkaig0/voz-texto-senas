// ============================================================================
// main.jsx — PUNTO DE ARRANQUE DE REACT.
// Vite carga este archivo desde index.html; aquí React "toma el control"
// del <div id="root"> y pinta dentro el componente raíz <App />.
// ============================================================================

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css' // los estilos globales se importan aquí para que Vite los incluya

// createRoot conecta React con el div del index.html y render() dibuja la app.
// Nota: no usamos React.StrictMode para evitar que los efectos se disparen
// dos veces en desarrollo (afectaría a los temporizadores y al micrófono).
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
