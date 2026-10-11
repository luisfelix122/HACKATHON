import { StrictMode, type ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
// Fuentes empaquetadas (sin CDN): la APK abre sin señal con su tipografía (decisión 0006).
// Fraunces es la letra de nombres propios y titulares; Atkinson, la de lectura y controles.
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource-variable/fraunces/index.css'
import './compartido/ui/tokens.css'
import './compartido/ui/estilos.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('No existe el elemento #root en index.html')

// Vite reemplaza MODE por una constante en el build y descarta la rama no usada:
// la APK (`--mode artesano`) no incluye la vitrina ni el admin, y la web no
// incluye las pantallas del artesano. Sin `await` de nivel superior, para no
// exigirlo a WebViews antiguos.
const cargarApp: Promise<ComponentType> =
  import.meta.env.MODE === 'artesano'
    ? import('./app/AppArtesano').then((modulo) => modulo.AppArtesano)
    : import('./app/AppWeb').then((modulo) => modulo.AppWeb)

/**
 * Raíz de React ya montada (las pruebas la usan para desmontarla), o `undefined`
 * si la App no cargó: en ese caso se muestra un mensaje, nunca una pantalla en blanco.
 */
export const montada: Promise<Root | undefined> = cargarApp.then(
  (App) => {
    const root = createRoot(raiz)
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    return root
  },
  (error: unknown) => {
    console.error('No se pudo cargar la App', error)
    const aviso = document.createElement('p')
    aviso.setAttribute('role', 'alert')
    aviso.textContent = 'No pudimos abrir Ayllu. Cierra la app y vuelve a abrirla.'
    raiz.replaceChildren(aviso)
    return undefined
  },
)
