import { useEffect, useState } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import type { Perfil } from './dominio/perfil'
import { obtenerSupabase } from './supabase'

// Sesión común de la web y la APK (docs/contratos.md §Acceso). El ingreso y el
// registro del artesano en la APK son del módulo A (PRP 001).

const MENSAJE_RED = 'No pudimos conectar. Revisa tu conexión y reintenta.'
const MENSAJE_GENERICO = 'No pudimos completar el ingreso. Reintenta en un momento.'

/** Error con un mensaje para mostrar tal cual (§Estados de interfaz: nunca códigos técnicos). */
export class ErrorSesion extends Error {
  readonly causa: unknown

  constructor(mensaje: string, causa?: unknown) {
    super(mensaje)
    this.name = 'ErrorSesion'
    this.causa = causa
  }
}

function aErrorSesion(error: { message: string }): ErrorSesion {
  const deRed = /fetch|network|red|timeout/i.test(error.message)
  return new ErrorSesion(deRed ? MENSAJE_RED : MENSAJE_GENERICO, error)
}

/**
 * Ruta interna a la que volver tras el ingreso. Solo acepta rutas de esta web
 * («/algo»): cualquier otra cosa vuelve al inicio, para no redirigir afuera.
 */
export function rutaSegura(volverA: string | null | undefined): string {
  if (
    !volverA ||
    !volverA.startsWith('/') ||
    volverA.startsWith('//') ||
    volverA.startsWith('/\\')
  ) {
    return '/'
  }
  return volverA
}

/** Ingreso del comprador con Google en la web; al volver, abre `volverA`. */
export async function iniciarSesionGoogle(
  volverA: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<void> {
  const { error } = await cliente.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${rutaSegura(volverA)}` },
  })
  if (error) throw aErrorSesion(error)
}

export async function cerrarSesion(cliente: SupabaseClient = obtenerSupabase()): Promise<void> {
  const { error } = await cliente.auth.signOut()
  if (error) throw aErrorSesion(error)
}

/** Avisa cada cambio de sesión (ingreso, salida, renovación). Devuelve cómo cancelar. */
export function suscribirSesion(
  alCambiar: (sesion: Session | null) => void,
  cliente: SupabaseClient = obtenerSupabase(),
): () => void {
  const { data } = cliente.auth.onAuthStateChange((_evento, sesion) => alCambiar(sesion))
  return () => data.subscription.unsubscribe()
}

function nombreInicial(usuario: User): string {
  const metadatos = usuario.user_metadata as { full_name?: unknown; name?: unknown }
  const deGoogle = [metadatos.full_name, metadatos.name].find(
    (valor): valor is string => typeof valor === 'string' && valor.trim() !== '',
  )
  const delCorreo = usuario.email?.split('@')[0]
  return (deGoogle ?? delCorreo ?? 'Comprador').trim().slice(0, 120)
}

async function leerPerfil(cliente: SupabaseClient, id: string): Promise<Perfil | null> {
  const { data, error } = await cliente.from('perfil').select('*').eq('id', id).maybeSingle()
  if (error) throw aErrorSesion(error)
  return data as Perfil | null
}

/**
 * Primer ingreso en la web: crea el perfil `comprador` una sola vez (CC-04).
 * Si ya existe (de cualquier rol), lo devuelve sin tocarlo.
 */
export async function asegurarPerfilComprador(
  usuario: User,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<Perfil> {
  const existente = await leerPerfil(cliente, usuario.id)
  if (existente) return existente

  const { data, error } = await cliente
    .from('perfil')
    .insert({ id: usuario.id, rol: 'comprador', nombre: nombreInicial(usuario) })
    .select()
    .single()

  if (error?.code === '23505') {
    // Otra pestaña lo creó al mismo tiempo: se usa ese.
    const creado = await leerPerfil(cliente, usuario.id)
    if (creado) return creado
  }
  if (error || !data) throw aErrorSesion(error ?? { message: 'sin datos' })
  return data as Perfil
}

/** Cliente si las variables de Supabase existen; si no, la app sigue mostrando lo público. */
function clienteDisponible(): SupabaseClient | null {
  try {
    return obtenerSupabase()
  } catch (error) {
    console.error(error)
    return null
  }
}

/** Sesión actual y sus cambios, para la interfaz. */
export function useSesion(): { sesion: Session | null; cargando: boolean } {
  const [cliente] = useState(clienteDisponible)
  const [estado, setEstado] = useState<{ sesion: Session | null; cargando: boolean }>({
    sesion: null,
    cargando: cliente !== null,
  })

  useEffect(() => {
    if (!cliente) return
    let vigente = true
    const cancelar = suscribirSesion((sesion) => {
      if (vigente) setEstado({ sesion, cargando: false })
    }, cliente)
    cliente.auth
      .getSession()
      .then(({ data }) => {
        if (vigente) setEstado({ sesion: data.session, cargando: false })
      })
      .catch(() => {
        if (vigente) setEstado({ sesion: null, cargando: false })
      })
    return () => {
      vigente = false
      cancelar()
    }
  }, [cliente])

  return estado
}
