import { useEffect } from 'react'
import { Link, Navigate, useNavigate, type RouteObject } from 'react-router-dom'
import { cerrarSesion } from '../compartido/sesion'
import { Boton, Aviso } from '../compartido/ui/componentes'
import { usePerfil, useSesionApk } from './usePerfil'
import { MENSAJE_ROL } from './sesionArtesano'
import { MisProductos } from '../borradores/MisProductos'
import { IngresoArtesano } from './IngresoArtesano'
import { RegistroArtesano } from './RegistroArtesano'

// Costura del módulo (CC-11, docs/modulos.md regla 2): este módulo declara aquí sus
// rutas y su menú. src/app/ las monta sin editarse. Empieza vacío.

/** Rutas de la web del comprador y del administrador. */
export const rutasWeb: RouteObject[] = []

/** Rutas de la APK del artesano. */
export function InicioArtesano({ cuenta = false }: { cuenta?: boolean }) {
  const navegar = useNavigate()
  const { sesion, cargando: leyendoSesion } = useSesionApk()
  const { perfil, cargando, error, actualizar } = usePerfil(sesion)
  const rolIncorrecto = perfil !== null && perfil.rol !== 'artesano'
  useEffect(() => {
    if (rolIncorrecto)
      void cerrarSesion()
        .then(() => {
          navegar('/ingresar', { replace: true, state: { error: MENSAJE_ROL } })
        })
        .catch(() => undefined)
  }, [rolIncorrecto, navegar])
  if (leyendoSesion || cargando)
    return (
      <main className="pagina">
        <p role="status">Leyendo tu cuenta…</p>
      </main>
    )
  if (!sesion) return <Navigate to="/ingresar" replace />
  if (rolIncorrecto)
    return (
      <main className="pagina">
        <Aviso tono="error">{MENSAJE_ROL}</Aviso>
        <Link to="/ingresar">Volver al ingreso</Link>
      </main>
    )
  if (error)
    return (
      <main className="pagina">
        <Aviso tono="error">{error}</Aviso>
        <Boton onClick={actualizar}>Reintentar</Boton>
      </main>
    )
  if (!perfil) return <RegistroArtesano />
  if (cuenta) return <RegistroArtesano cuenta />
  return <MisProductos perfil={perfil} />
}
export const rutasArtesano: RouteObject[] = [
  { path: '/', element: <InicioArtesano /> },
  { path: '/ingresar', element: <IngresoArtesano /> },
  { path: '/registro', element: <RegistroArtesano /> },
  { path: '/cuenta', element: <InicioArtesano cuenta /> },
]

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = [
  { ruta: '/cuenta', etiqueta: 'Tu cuenta' },
]
