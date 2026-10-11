import { useState } from 'react'
import {
  createBrowserRouter,
  Navigate,
  NavLink,
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
import { Logotipo } from '../compartido/ui/componentes'
import { Icono, type NombreIcono } from '../compartido/ui/Icono'

// APK del artesano. Monta solo las rutas y el menú que los módulos declaran en
// su rutas.tsx (CC-11): no incluye la vitrina ni el panel del administrador.
const MODULOS = [acceso, admin, borradores, publicacion, vitrina, pedidos]

function MisProductos() {
  return (
    <main className="pagina pagina-artesano">
      <h1>Mis productos</h1>
      <p className="texto-secundario">Aún no tienes productos. Toca Nuevo.</p>
    </main>
  )
}

/** Pantalla de relleno: se usa solo mientras ningún módulo declare «/». */
const RUTAS_DE_RELLENO: RouteObject[] = [{ path: '/', element: <MisProductos /> }]

function combinarRutas(deModulos: RouteObject[], deRelleno: RouteObject[]): RouteObject[] {
  const declaradas = new Set(deModulos.map((ruta) => ruta.path))
  return [...deModulos, ...deRelleno.filter((ruta) => !declaradas.has(ruta.path))]
}

/**
 * Presentación de las pestañas (decisión 0006): icono y orden por ruta. Las
 * entradas siguen saliendo de los `menuArtesano` de los módulos; una ruta nueva
 * sin icono propio usa una flecha y va al final.
 */
const PRESENTACION_PESTANA: Record<string, { icono: NombreIcono; orden: number }> = {
  '/': { icono: 'productos', orden: 0 },
  '/nuevo': { icono: 'nuevo', orden: 1 },
  '/pedidos': { icono: 'pedidos', orden: 2 },
  '/cuenta': { icono: 'cuenta', orden: 3 },
}

const MENU = MODULOS.flatMap((modulo) => modulo.menuArtesano)
  .map((entrada) => ({
    ...entrada,
    ...(PRESENTACION_PESTANA[entrada.ruta] ?? { icono: 'adelante' as const, orden: 99 }),
  }))
  .sort((a, b) => a.orden - b.orden)

/** Ingreso y registro: todavía no hay sesión, así que las pestañas no llevarían a nada. */
const SIN_PESTANAS = new Set(['/ingresar', '/registro'])

function Marco() {
  const { pathname } = useLocation()
  const conPestanas = MENU.length > 0 && !SIN_PESTANAS.has(pathname)
  return (
    <>
      <header className="barra">
        <div className="barra-contenido">
          <Logotipo />
        </div>
      </header>
      <div className={conPestanas ? 'con-pestanas' : undefined}>
        <Outlet />
      </div>
      {conPestanas && (
        <nav aria-label="Menú" className="pestanas">
          {MENU.map((entrada) => (
            <NavLink
              key={entrada.ruta}
              to={entrada.ruta}
              end={entrada.ruta === '/'}
              className="pestana"
            >
              <Icono nombre={entrada.icono} tamano={26} />
              {entrada.etiqueta}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  )
}

export function AppArtesano() {
  const [router] = useState(() =>
    createBrowserRouter([
      {
        element: <Marco />,
        children: [
          ...combinarRutas(
            MODULOS.flatMap((modulo) => modulo.rutasArtesano),
            RUTAS_DE_RELLENO,
          ),
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ]),
  )
  return <RouterProvider router={router} />
}
