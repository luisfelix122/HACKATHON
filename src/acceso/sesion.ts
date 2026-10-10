import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { CLAVE_SESION, supabase } from '../compartido/supabase'

/** Web: comprador o registro del artesano (CC-03). Vuelve a `rutaRetorno`. */
export async function ingresarConGoogle(rutaRetorno: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${rutaRetorno}` },
  })
  if (error) throw error
}

export type ErrorIngreso =
  'credenciales_invalidas' | 'sin_conexion' | 'rol_incorrecto' | 'sin_registro' | 'desconocido'

/**
 * APK: correo de Google y contraseña definida en la web (CC-03). Solo deja
 * entrar a perfiles de artesano; si no lo es, cierra la sesión y lo informa.
 */
export async function ingresarArtesano(
  correo: string,
  contrasena: string,
): Promise<ErrorIngreso | null> {
  if (!navigator.onLine) return 'sin_conexion'
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: contrasena,
  })
  if (error) {
    if (isAuthRetryableFetchError(error)) return 'sin_conexion'
    // No se distingue correo de contraseña para no revelar qué cuentas existen.
    return error.code === 'invalid_credentials' ? 'credenciales_invalidas' : 'desconocido'
  }

  const { data: perfil, error: errorPerfil } = await supabase
    .from('perfil')
    .select('rol')
    .eq('id', data.user.id)
    .maybeSingle()
  if (errorPerfil) {
    await cerrarSesion()
    return 'desconocido'
  }
  if (perfil?.rol === 'artesano') return null
  await cerrarSesion()
  return perfil ? 'rol_incorrecto' : 'sin_registro'
}

/** Cierra la sesión y borra las copias locales del perfil (datos personales). */
export async function cerrarSesion(): Promise<void> {
  try {
    for (const clave of Object.keys(localStorage)) {
      if (clave.startsWith('aylly.perfil.')) localStorage.removeItem(clave)
    }
  } catch {
    // Sin almacenamiento disponible: no hay copias que borrar.
  }
  await supabase.auth.signOut({ scope: 'local' })
}

/**
 * Sesión guardada en el dispositivo, aunque su token haya vencido. Solo se usa
 * sin conexión para decidir qué pantalla mostrar; las llamadas al servidor
 * esperan a que el cliente refresque el token al volver la red.
 */
function sesionGuardada(): Session | null {
  try {
    const texto = localStorage.getItem(CLAVE_SESION)
    const sesion = texto ? (JSON.parse(texto) as Session) : null
    return sesion?.user?.id ? sesion : null
  } catch {
    return null
  }
}

/** Sesión actual. `undefined` mientras se lee la sesión guardada. */
export function useSesion(): Session | null | undefined {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        // Con el token vencido y sin red, getSession no puede refrescar: se usa
        // la sesión guardada para que la APK abra igual (PRP 001, criterio 5).
        const sinRed = !navigator.onLine || (error !== null && isAuthRetryableFetchError(error))
        setSesion(data.session ?? (sinRed ? sesionGuardada() : null))
      })
      .catch(() => setSesion(sesionGuardada()))
    const { data } = supabase.auth.onAuthStateChange((evento, nueva) => {
      if (evento === 'INITIAL_SESSION') return
      setSesion(nueva)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  return sesion
}
