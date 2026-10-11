import { Navigate, type RouteObject } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePerfil, useSesionApk } from '../acceso/usePerfil'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { EditorBorrador } from './EditorBorrador'
import { MisProductos } from './MisProductos'

// Costura del módulo (CC-11, docs/modulos.md regla 2): este módulo declara aquí sus
// rutas y su menú. src/app/ las monta sin editarse.

/** Rutas de la web del comprador y del administrador. */
export const rutasWeb: RouteObject[] = []

function AccesoBorradores({ children }: { children: ReactNode }) {
  const { sesion, cargando } = useSesionApk()
  const cuenta = usePerfil(sesion)
  if (cargando || (sesion && !cuenta.perfil && cuenta.cargando))
    return (
      <main className="pagina">
        <p role="status">Leyendo tu cuenta…</p>
      </main>
    )
  if (!sesion) return <Navigate to="/ingresar" replace />
  if (cuenta.error && !cuenta.perfil)
    return (
      <main className="pagina">
        <Aviso tono="error">{cuenta.error}</Aviso>
        <Boton onClick={cuenta.actualizar}>Reintentar</Boton>
      </main>
    )
  if (!cuenta.perfil) return <Navigate to="/registro" replace />
  if (cuenta.perfil.rol !== 'artesano') return <Navigate to="/ingresar" replace />
  return children
}

/** Rutas de la APK del artesano. */
export const rutasArtesano: RouteObject[] = [
  {
    path: '/',
    element: (
      <AccesoBorradores>
        <MisProductos />
      </AccesoBorradores>
    ),
  },
  {
    path: '/nuevo',
    element: (
      <AccesoBorradores>
        <EditorBorrador />
      </AccesoBorradores>
    ),
  },
  {
    path: '/borrador/:id',
    element: (
      <AccesoBorradores>
        <EditorBorrador />
      </AccesoBorradores>
    ),
  },
]

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = [
  {
    etiqueta: 'Mis productos',
    ruta: '/',
  },
]
