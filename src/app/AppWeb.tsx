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
  const { pathname, search } = useLocation()
  const [errorPerfil, setErrorPerfil] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [saliendo, setSaliendo] = useState(false)
  const [errorSalida, setErrorSalida] = useState<string | null>(null)
  const usuario = sesion?.user

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
      .then(() => vigente && setErrorPerfil(null))
      .catch((causa: unknown) => {
        if (!vigente) return
        setErrorPerfil(
          causa instanceof ErrorSesion ? causa.message : 'No pudimos cargar tu cuenta.',
        )
      })
    return () => {
      vigente = false
    }
  }, [usuario, intento])

  return (
    <>
      <header className="barra">
        <div className="barra-contenido">
          <Link to="/" aria-label="Ayllu, inicio">
            <Logotipo />
          </Link>
          {sesion ? (
            <Boton variante="secundario" cargando={saliendo} onClick={() => void salir()}>
              Salir
            </Boton>
          ) : (
            !cargando &&
            pathname !== '/ingresar' && (
              <Link to={`/ingresar?volver=${encodeURIComponent(pathname + search)}`}>Ingresar</Link>
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
      <Outlet />
    </>
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
          { path: '*', element: <NoEncontrada /> },
        ],
      },
    ]),
  )
  return <RouterProvider router={router} />
}
