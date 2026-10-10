import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { PantallaIngresoWeb } from '../acceso/PantallaIngresoWeb'
import { asegurarPerfilComprador } from '../acceso/perfil'
import { cerrarSesion, useSesion } from '../acceso/sesion'
import { usePerfil } from '../acceso/usePerfil'
import { PanelAcreditacion } from '../admin/PanelAcreditacion'
import { Aviso, Boton, Etiqueta, Logotipo, SelloRna } from '../compartido/ui/componentes'

/** Caletas de norte a sur, como se recorren por la costa. */
const RUTA_NORTE_SUR = [
  'Punta Sal',
  'Máncora',
  'Los Órganos',
  'El Ñuro',
  'Cabo Blanco',
  'El Alto',
  'Lobitos',
  'Pariñas',
  'Colán',
]

function Marco({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="barra">
        <div className="barra-interior">
          <Logotipo como="a" />
          <nav className="nav" aria-label="Principal">
            <Link to="/ingresar">Ingresar</Link>
            <a href="/#artesanos">Soy artesano</a>
          </nav>
        </div>
      </header>
      {children}
    </>
  )
}

/** Hilo del que cuelga la etiqueta de ejemplo en la portada. */
function Pabilo() {
  return (
    <svg className="pabilo" viewBox="0 0 352 58" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M250 0 C 230 22, 186 30, 176 58"
        fill="none"
        stroke="var(--pacifico-hondo)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Inicio() {
  return (
    <Marco>
      <main>
        <section className="pagina portada" aria-labelledby="portada-titulo">
          <div className="portada-texto">
            <h1 id="portada-titulo">Piezas hechas a mano en las caletas del norte.</h1>
            <p>
              Cada pieza llega con el nombre de quien la hizo, su caleta y su registro de artesano
              verificado. La pides aquí, y te la envían por agencia o la recoges en su casa.
            </p>
            <div className="acciones">
              <Link className="boton boton-destacado" to="/ingresar">
                Ingresar para pedir
              </Link>
            </div>
          </div>
          <div className="portada-pieza">
            <Pabilo />
            <Etiqueta
              lugar="Lobitos"
              titulo="Poncho-toalla para surf"
              artesano="nombre del artesano"
              nota="Pieza de ejemplo: la vitrina se llena con las piezas publicadas."
            />
            <SelloRna estado="aprobada" />
          </div>
        </section>
        <section className="ruta" aria-labelledby="ruta-titulo">
          <div className="ruta-interior">
            <h2 id="ruta-titulo">La ruta de la costa</h2>
            <ol aria-label="Caletas de norte a sur">
              {RUTA_NORTE_SUR.map((lugar) => (
                <li key={lugar}>{lugar}</li>
              ))}
            </ol>
            <p className="ruta-nota">De norte a sur, las caletas donde trabajan los artesanos.</p>
          </div>
        </section>
        <section id="artesanos" className="pagina" aria-labelledby="artesanos-titulo">
          <h2 id="artesanos-titulo">¿Eres artesano?</h2>
          <p>
            Vendes con la app Ayllu para Android: creas tu cuenta con Google, registras tus piezas
            aunque no tengas señal y recibes los pedidos en tu celular.
          </p>
          <p className="nota">El enlace de descarga se publicará aquí cuando la app esté lista.</p>
        </section>
      </main>
    </Marco>
  )
}

function ProductoPendiente() {
  return (
    <Marco>
      <main className="pagina">
        <Aviso tono="info">Este producto no está disponible.</Aviso>
        <Link to="/">Volver al inicio</Link>
      </main>
    </Marco>
  )
}

/** Ingreso del comprador: al volver de Google crea su perfil si no existe. */
function Ingresar() {
  const sesion = useSesion()
  const [listo, setListo] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!sesion) return
    const nombre = (sesion.user.user_metadata?.full_name as string | undefined) ?? ''
    asegurarPerfilComprador(sesion.user.id, nombre)
      .then(() => setListo(true))
      .catch(() => setError(true))
  }, [sesion])

  let contenido: ReactNode
  if (sesion === undefined) contenido = <p className="cargando">Cargando…</p>
  else if (!sesion) contenido = <PantallaIngresoWeb rutaRetorno="/ingresar" />
  else if (error)
    contenido = <Aviso tono="error">No pudimos preparar tu cuenta. Recarga la página.</Aviso>
  else if (listo) return <Navigate to="/" replace />
  else contenido = <p className="cargando">Preparando tu cuenta…</p>

  return (
    <Marco>
      <main className="pagina">{contenido}</main>
    </Marco>
  )
}

function Admin() {
  const sesion = useSesion()
  const { perfil, cargando } = usePerfil(sesion?.user.id)

  let contenido: ReactNode
  if (sesion === undefined || cargando) contenido = <p className="cargando">Cargando…</p>
  else if (!sesion) contenido = <PantallaIngresoWeb rutaRetorno="/admin" />
  else if (perfil?.rol !== 'admin')
    contenido = (
      <>
        <Aviso tono="alerta">Esta sección es solo para administradores.</Aviso>
        <div>
          <Boton variante="secundario" onClick={cerrarSesion}>
            Cerrar sesión
          </Boton>
        </div>
      </>
    )
  else
    contenido = (
      <>
        <h1>Solicitudes de acreditación</h1>
        <p className="nota">Revisa el número de RNA declarado antes de aprobar.</p>
        <PanelAcreditacion />
      </>
    )

  return (
    <Marco>
      <main className="pagina">{contenido}</main>
    </Marco>
  )
}

/** Web del comprador y del administrador (servidor propio, CC-05). */
export function AppWeb() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/ingresar" element={<Ingresar />} />
        <Route path="/producto/:id" element={<ProductoPendiente />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
