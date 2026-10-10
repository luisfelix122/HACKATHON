import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
// Fuentes empaquetadas (sin CDN) para que la APK abra sin señal con su tipografía.
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import './compartido/ui/tokens.css'
import './compartido/ui/estilos.css'

// Vite reemplaza MODE por una constante en el build y descarta la rama no
// usada: la APK (`--mode artesano`) no incluye la vitrina ni el admin, y la
// web no incluye los plugins de Capacitor que la APK registra al cargarse.
const App: ComponentType =
  import.meta.env.MODE === 'artesano'
    ? (await import('./app/AppArtesano')).AppArtesano
    : (await import('./app/AppWeb')).AppWeb

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No existe el elemento #root en index.html')

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
