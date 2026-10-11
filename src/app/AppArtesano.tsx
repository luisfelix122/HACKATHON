import { useState } from 'react'
import {
  createBrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom'
import * as acceso from '../acceso/rutas'
import * as admin from '../admin/rutas'
import * as borradores from '../borradores/rutas'
import * as pedidos from '../pedidos/rutas'
import * as publicacion from '../publicacion/rutas'
import * as vitrina from '../vitrina/rutas'
import { Logotipo } from '../compartido/ui/componentes'

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

const MENU = MODULOS.flatMap((modulo) => modulo.menuArtesano)

function Marco() {
  return (
    <>
      <header className="barra">
        <div className="barra-contenido">
          <Logotipo />
          {MENU.length > 0 && (
            <nav aria-label="Menú" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--e4)' }}>
              {MENU.map((entrada) => (
                <NavLink key={entrada.ruta} to={entrada.ruta}>
                  {entrada.etiqueta}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <Outlet />
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
