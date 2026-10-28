import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/baloo-2/latin-800.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-800.css'
import './index.css'
import { App } from './ui/App'
import { iniciarActualizaciones } from './actualizar'
import { inject } from '@vercel/analytics'

iniciarActualizaciones()
// Contador de visitas de Vercel: anónimo y sin cookies. Solo en la web publicada.
if (import.meta.env.MODE === 'production') inject()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
