import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppArtesano } from './app/AppArtesano'
import { AppWeb } from './app/AppWeb'
// Fuentes empaquetadas (sin CDN) para que la APK abra sin señal con su tipografía.
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import './compartido/ui/tokens.css'
import './compartido/ui/estilos.css'

// Vite reemplaza MODE por una constante en el build, así que la rama no usada
// se elimina: la APK (`--mode artesano`) no incluye la vitrina ni el admin.
const App = import.meta.env.MODE === 'artesano' ? AppArtesano : AppWeb

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No existe el elemento #root en index.html')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
