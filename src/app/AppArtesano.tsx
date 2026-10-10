import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { EstadoAcreditacion } from '../acceso/EstadoAcreditacion'
import { IngresoArtesano } from '../acceso/IngresoArtesano'
import type { Perfil } from '../acceso/perfil'
import { cerrarSesion, useSesion, type ErrorIngreso } from '../acceso/sesion'
import { usePerfil } from '../acceso/usePerfil'

function MisProductos({ perfil, sinConexion }: { perfil: Perfil; sinConexion: boolean }) {
  return (
    <main className="pagina">
      {sinConexion && (
        <p className="aviso" role="status">
          Sin señal: lo guardamos en tu celular.
        </p>
      )}
      <h1>Mis productos</h1>
      <EstadoAcreditacion perfil={perfil} />
      <p>Aún no tienes productos.</p>
      <button className="secundario" onClick={cerrarSesion}>
        Cerrar sesión
      </button>
    </main>
  )
}

/** Sesión válida pero sin perfil de artesano: la cierra y vuelve al ingreso con el motivo. */
function CuentaNoArtesano(props: {
  motivo: ErrorIngreso
  alCerrar: (motivo: ErrorIngreso) => void
}) {
  const { motivo, alCerrar } = props
  useEffect(() => {
    void cerrarSesion().then(() => alCerrar(motivo))
  }, [motivo, alCerrar])
  return <p className="pagina">Cerrando sesión…</p>
}

function Inicio() {
  const sesion = useSesion()
  const { perfil, cargando, sinConexion } = usePerfil(sesion?.user.id)
  // El motivo sobrevive al cierre de sesión para mostrarlo en el ingreso.
  const [motivo, setMotivo] = useState<ErrorIngreso | undefined>(undefined)

  if (sesion === undefined || cargando) return <p className="pagina">Cargando…</p>
  if (!sesion) return <IngresoArtesano key={motivo ?? 'sin-motivo'} motivo={motivo} />
  if (!perfil) {
    // Sin conexión y sin copia local no se puede decidir: se espera a la red.
    if (sinConexion) return <p className="pagina">Sin señal. Conéctate una vez para continuar.</p>
    return <CuentaNoArtesano motivo="sin_registro" alCerrar={setMotivo} />
  }
  if (perfil.rol !== 'artesano')
    return <CuentaNoArtesano motivo="rol_incorrecto" alCerrar={setMotivo} />
  return <MisProductos perfil={perfil} sinConexion={sinConexion} />
}

/**
 * APK del artesano (Capacitor). HashRouter porque la app se sirve desde
 * archivos locales dentro de la APK y no hay servidor que resuelva rutas.
 */
export function AppArtesano() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<Inicio />} />
      </Routes>
    </HashRouter>
  )
}
