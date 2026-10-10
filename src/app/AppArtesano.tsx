import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { EstadoAcreditacion } from '../acceso/EstadoAcreditacion'
import { escucharRetornoDeGoogle } from '../acceso/googleApk'
import { IngresoArtesano, type MotivoIngreso } from '../acceso/IngresoArtesano'
import type { Perfil } from '../acceso/perfil'
import { FormularioArtesano, NuevaContrasena } from '../acceso/RegistroArtesano'
import { cerrarSesion, useSesion } from '../acceso/sesion'
import { usePerfil } from '../acceso/usePerfil'
import { Aviso, Boton, Logotipo } from '../compartido/ui/componentes'

function MisProductos(props: { perfil: Perfil; sinConexion: boolean; salir: () => void }) {
  const { perfil, sinConexion, salir } = props
  return (
    <main className="pagina">
      {sinConexion && (
        <Aviso tono="sin-senal">Sin señal: lo que hagas se guarda en tu celular.</Aviso>
      )}
      <h1>Hola, {perfil.nombre}</h1>
      <EstadoAcreditacion perfil={perfil} />
      <h2>Mis productos</h2>
      <p>Aún no tienes productos. Toma la foto de tu primera pieza para empezar.</p>
      <h2>Tu cuenta</h2>
      {sinConexion ? (
        <p className="nota">Para cambiar tu contraseña necesitas señal.</p>
      ) : (
        <NuevaContrasena />
      )}
      <div>
        <Boton variante="secundario" onClick={salir}>
          Cerrar sesión
        </Boton>
      </div>
    </main>
  )
}

/** Cuenta que no es de artesano: la cierra y vuelve al ingreso con el motivo. */
function CuentaNoArtesano({ alCerrar }: { alCerrar: (motivo: MotivoIngreso) => void }) {
  useEffect(() => {
    void cerrarSesion().then(() => alCerrar('rol_incorrecto'))
  }, [alCerrar])
  return <p className="pagina cargando">Cerrando sesión…</p>
}

function Inicio({
  motivo,
  setMotivo,
}: {
  motivo: MotivoIngreso | undefined
  setMotivo: (motivo: MotivoIngreso | undefined) => void
}) {
  const sesion = useSesion()
  // Al salir a propósito se borra cualquier aviso anterior (por ejemplo, un google_fallo viejo).
  const salir = () => {
    setMotivo(undefined)
    void cerrarSesion()
  }
  const { perfil, cargando, sinConexion, recargar } = usePerfil(sesion?.user.id)

  if (sesion === undefined || cargando) return <p className="pagina cargando">Cargando…</p>
  if (!sesion) return <IngresoArtesano key={motivo ?? 'sin-motivo'} motivo={motivo} />
  if (!perfil) {
    // Sin conexión y sin copia local no se puede decidir: se espera a la red.
    if (sinConexion)
      return (
        <main className="pagina">
          <Aviso tono="sin-senal">Sin señal. Conéctate una vez para continuar.</Aviso>
        </main>
      )
    // Recién creada con Google (CC-06): falta la contraseña y el perfil.
    return (
      <>
        <FormularioArtesano
          id={sesion.user.id}
          correo={sesion.user.email ?? ''}
          nombreInicial={(sesion.user.user_metadata?.full_name as string | undefined) ?? ''}
          alTerminar={recargar}
        />
        <div className="pagina">
          <Boton variante="secundario" onClick={salir}>
            Usar otra cuenta de Google
          </Boton>
        </div>
      </>
    )
  }
  if (perfil.rol !== 'artesano') return <CuentaNoArtesano alCerrar={setMotivo} />
  return <MisProductos perfil={perfil} sinConexion={sinConexion} salir={salir} />
}

/**
 * APK del artesano (Capacitor). HashRouter porque la app se sirve desde
 * archivos locales dentro de la APK y no hay servidor que resuelva rutas.
 */
export function AppArtesano() {
  // El motivo sobrevive al cierre de sesión para mostrarlo en el ingreso.
  const [motivo, setMotivo] = useState<MotivoIngreso | undefined>(undefined)

  useEffect(() => escucharRetornoDeGoogle(() => setMotivo('google_fallo')), [])

  return (
    <HashRouter>
      <header className="barra">
        <div className="barra-interior">
          <Logotipo />
        </div>
      </header>
      <Routes>
        <Route path="*" element={<Inicio motivo={motivo} setMotivo={setMotivo} />} />
      </Routes>
    </HashRouter>
  )
}
