import { Esqueleto } from '../compartido/ui/Esqueleto'
import { useEffect, useState } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import { useSesion } from '../compartido/sesion'
import { leerPerfil } from '../acceso/perfil'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { PanelAcreditacion } from './PanelAcreditacion'

// Costura del módulo (CC-11, docs/modulos.md regla 2): este módulo declara aquí sus
// rutas y su menú. src/app/ las monta sin editarse. Empieza vacío.

/** Rutas de la web del comprador y del administrador. */
export function AccesoAdmin() {
  const { sesion, cargando } = useSesion()
  const id = sesion?.user.id
  const [estado, setEstado] = useState<{ id?: string; admin: boolean; error: boolean }>({
    admin: false,
    error: false,
  })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!id) return
    let vigente = true
    void leerPerfil(id)
      .then((perfil) => {
        if (vigente) setEstado({ id, admin: perfil?.rol === 'admin', error: false })
      })
      .catch(() => {
        if (vigente) setEstado({ id, admin: false, error: true })
      })
    return () => {
      vigente = false
    }
  }, [id, revision])
  if (cargando) return <Esqueleto variante="formulario" etiqueta="Leyendo tu sesión…" />
  if (!id) return <Navigate to="/ingresar?volver=/admin" replace />
  if (estado.id !== id) return <Esqueleto variante="formulario" etiqueta="Comprobando permisos…" />
  if (estado.error)
    return (
      <main className="pagina">
        <Aviso tono="error">No pudimos comprobar tus permisos.</Aviso>
        <Boton onClick={() => setRevision((v) => v + 1)}>Reintentar</Boton>
      </main>
    )
  if (!estado.admin)
    return (
      <main className="pagina">
        <Aviso tono="error">Solo el administrador puede revisar las acreditaciones.</Aviso>
      </main>
    )
  return <PanelAcreditacion />
}
export const rutasWeb: RouteObject[] = [{ path: '/admin', element: <AccesoAdmin /> }]

/** Rutas de la APK del artesano. */
export const rutasArtesano: RouteObject[] = []

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = []
