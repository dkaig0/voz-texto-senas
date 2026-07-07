import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Nota: no usamos React.StrictMode para evitar que los efectos se disparen
// dos veces en desarrollo (la SDK abre webcam / websockets en efectos).
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
