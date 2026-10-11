import type { SupabaseClient } from '@supabase/supabase-js'
import { cerrarSesion, ErrorSesion } from '../compartido/sesion'
import { obtenerSupabase } from '../compartido/supabase'
import { leerPerfil, validarContrasena } from './perfil'

export const MENSAJE_ROL =
  'Esta cuenta es de comprador. Para vender, crea tu cuenta con otro correo de Google.'
export async function ingresarArtesano(
  email: string,
  password: string,
  cliente: SupabaseClient = obtenerSupabase(),
) {
  const { data, error } = await cliente.auth.signInWithPassword({ email: email.trim(), password })
  if (error || !data.user) throw new ErrorSesion('Correo o contraseña incorrectos')
  const perfil = await leerPerfil(data.user.id, cliente)
  if (perfil && perfil.rol !== 'artesano') {
    await cerrarSesion(cliente)
    throw new ErrorSesion(MENSAJE_ROL)
  }
  return perfil
}

export async function registrarCorreo(
  email: string,
  password: string,
  confirmacion: string,
  cliente: SupabaseClient = obtenerSupabase(),
) {
  validarContrasena(password, confirmacion)
  const { data, error } = await cliente.auth.signUp({ email: email.trim(), password })
  if (error?.code === 'user_already_exists' || data.user?.identities?.length === 0)
    throw new ErrorSesion('Ese correo ya tiene cuenta. Entra con tu contraseña.')
  if (error)
    throw new ErrorSesion('No pudimos crear la cuenta. Revisa tu correo y conexión y reintenta.')
  if (!data.session)
    throw new ErrorSesion(
      'El registro requiere autoconfirmación. Pide al administrador revisar la configuración.',
    )
  return data.session
}

export async function cambiarContrasena(
  password: string,
  confirmacion: string,
  cliente: SupabaseClient = obtenerSupabase(),
) {
  validarContrasena(password, confirmacion)
  const { error } = await cliente.auth.updateUser({ password })
  if (error)
    throw new ErrorSesion(
      'No pudimos guardar la contraseña. Puede requerir un nuevo ingreso; avisa al administrador.',
    )
}
