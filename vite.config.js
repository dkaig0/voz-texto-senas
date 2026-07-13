// ============================================================================
// vite.config.js — Configuración de Vite (servidor de desarrollo y build).
// El plugin de React permite escribir JSX y activa la recarga en caliente.
// ============================================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // http://localhost:5173
    open: true, // abre el navegador al arrancar npm run dev
  },
})
