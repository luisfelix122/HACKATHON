import { useEffect, useState } from 'react'
import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
  useLocation,
  type RouteObject,
} from 'react-router-dom'
import * as acceso from '../acceso/rutas'
import * as admin from '../admin/rutas'
import * as borradores from '../borradores/rutas'
import * as pedidos from '../pedidos/rutas'
import * as publicacion from '../publicacion/rutas'
import * as vitrina from '../vitrina/rutas'
import { PantallaIngresoWeb } from '../compartido/PantallaIngresoWeb'
import { asegurarPerfilComprador, cerrarSesion, ErrorSesion, useSesion } from '../compartido/sesion'
import { Aviso, Boton, Logotipo } from '../compartido/ui/componentes'
import { Terminos } from '../compartido/Terminos'
import './web.css'

// Web del comprador y del administrador. Cada módulo declara sus rutas en su
// rutas.tsx (CC-11); este archivo no se edita para agregar pantallas.
const MODULOS = [acceso, admin, borradores, publicacion, vitrina, pedidos]

function Portada() {
  return (
    <main className="pagina">
      <section className="portada">
        <h1>Ayllu</h1>
        <p className="portada-bajada">
          Piezas hechas a mano en las caletas del norte de Piura, con el nombre de quien las hizo.
        </p>
      </section>
      <Aviso>Las piezas aparecen aquí cuando los artesanos las publican.</Aviso>
    </main>
  )
}

function Producto() {
  return (
    <main className="pagina">
      <h1>Producto</h1>
      <Aviso>La ficha de cada pieza se muestra aquí.</Aviso>
    </main>
  )
}

function Administracion() {
  return (
    <main className="pagina">
      <h1>Administración</h1>
      <Aviso>Aquí revisarás el RNA de los artesanos que piden acreditación.</Aviso>
    </main>
  )
}

function NoEncontrada() {
  return (
    <main className="pagina">
      <h1>Página no encontrada</h1>
      <p className="texto-secundario">Esta dirección no existe o cambió.</p>
      <p>
        <Link className="boton boton-secundario" to="/">
          Volver al inicio
        </Link>
      </p>
    </main>
  )
}

/** Pantallas de relleno: se usan solo mientras ningún módulo declare esa ruta. */
const RUTAS_DE_RELLENO: RouteObject[] = [
  { path: '/', element: <Portada /> },
  { path: '/producto/:id', element: <Producto /> },
  { path: '/admin', element: <Administracion /> },
]

function combinarRutas(deModulos: RouteObject[], deRelleno: RouteObject[]): RouteObject[] {
  const declaradas = new Set(deModulos.map((ruta) => ruta.path))
  return [...deModulos, ...deRelleno.filter((ruta) => !declaradas.has(ruta.path))]
}

function Marco() {
  const { sesion, cargando } = useSesion()
  const { pathname, search, hash } = useLocation()
  const [adminDe, setAdminDe] = useState<string | null>(null)
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [saliendo, setSaliendo] = useState(false)
  const [errorSalida, setErrorSalida] = useState<string | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const usuario = sesion?.user

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [pathname, hash])

  async function salir() {
    if (saliendo) return
    setSaliendo(true)
    setErrorSalida(null)
    try {
      await cerrarSesion()
    } catch (causa) {
      setErrorSalida(causa instanceof ErrorSesion ? causa.message : 'No pudimos cerrar tu sesión.')
    } finally {
      setSaliendo(false)
    }
  }

  // Primer ingreso con Google en la web: crea el perfil comprador una sola vez (CC-04).
  useEffect(() => {
    if (!usuario) return
    let vigente = true
    asegurarPerfilComprador(usuario)
      .then((perfil) => {
        if (!vigente) return
        setErrorPerfil(null)
        setAdminDe(perfil.rol === 'admin' ? usuario.id : null)
      })
      .catch((causa: unknown) => {
        if (!vigente) return
        setAdminDe(null)
        setErrorPerfil(
          causa instanceof ErrorSesion ? causa.message : 'No pudimos cargar tu cuenta.',
        )
      })
    return () => {
      vigente = false
    }
  }, [usuario, intento])

  return (
    <div className="web-ayllu">
      <a className="saltar-contenido" href="#contenido">
        Saltar al contenido
      </a>
      <header className="barra">
        <div className="barra-contenido">
          <Link to="/" aria-label="Ayllu, inicio">
            <Logotipo />
          </Link>
          <button
            className="menu-abrir"
            aria-expanded={menuAbierto}
            aria-controls="menu-web"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? 'Cerrar' : 'Menú'}
          </button>
          <nav
            id="menu-web"
            className={menuAbierto ? 'menu-web abierto' : 'menu-web'}
            aria-label="Principal"
          >
            <Link
              to="/catalogo"
              aria-current={pathname === '/catalogo' ? 'page' : undefined}
              onClick={() => setMenuAbierto(false)}
            >
              Catálogo
            </Link>
            <Link to="/#caletas" onClick={() => setMenuAbierto(false)}>
              Las caletas
            </Link>
            <Link to="/#como-pedir" onClick={() => setMenuAbierto(false)}>
              Cómo pedir
            </Link>
            <Link to="/pedidos" onClick={() => setMenuAbierto(false)}>
              Mis pedidos
            </Link>
            {usuario && adminDe === usuario.id && (
              <Link to="/admin" onClick={() => setMenuAbierto(false)}>
                Administración
              </Link>
            )}
          </nav>
          {sesion ? (
            <Boton variante="secundario" cargando={saliendo} onClick={() => void salir()}>
              Salir
            </Boton>
          ) : (
            !cargando &&
            pathname !== '/ingresar' && (
              <Link
                className="cuenta-web"
                aria-label="Ingresar"
                to={`/ingresar?volver=${encodeURIComponent(pathname + search)}`}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <circle cx="16" cy="16" r="14" />
                  <circle cx="16" cy="12" r="4" />
                  <path d="M8 25v-3c0-7 16-7 16 0v3" />
                </svg>
                <span>Mi cuenta</span>
              </Link>
            )
          )}
        </div>
      </header>
      {errorSalida && (
        <div className="pagina">
          <Aviso tono="error">{errorSalida}</Aviso>
          <Boton variante="secundario" cargando={saliendo} onClick={() => void salir()}>
            Reintentar salida
          </Boton>
        </div>
      )}
      {errorPerfil && (
        <div className="pagina">
          <Aviso tono="error">{errorPerfil}</Aviso>
          <p>
            <Boton variante="secundario" onClick={() => setIntento((n) => n + 1)}>
              Reintentar
            </Boton>
          </p>
        </div>
      )}
      <div id="contenido" tabIndex={-1}>
        <Outlet />
      </div>
      <footer className="pie-web">
        <Link to="/" aria-label="Ayllu, inicio">
          <Logotipo />
        </Link>
        <p>Oficio, mar y un origen que viaja contigo.</p>
        <nav aria-label="Navegación del pie">
          <Link to="/catalogo">Explorar las piezas</Link>
          <Link to="/#como-pedir">Cómo pedir</Link>
          <Link to="/pedidos">Mis pedidos</Link>
          <Link to="/terminos">Términos y condiciones</Link>
        </nav>
        <small>Ayllu · Artesanía de las caletas del norte de Piura</small>
      </footer>
    </div>
  )
}

export function AppWeb() {
  const [router] = useState(() =>
    createBrowserRouter([
      {
        element: <Marco />,
        children: [
          ...combinarRutas(
            MODULOS.flatMap((modulo) => modulo.rutasWeb),
            RUTAS_DE_RELLENO,
          ),
          { path: '/ingresar', element: <PantallaIngresoWeb /> },
          { path: '/terminos', element: <Terminos /> },
          { path: '*', element: <NoEncontrada /> },
        ],
      },
    ]),
  )
  return <RouterProvider router={router} />
}
