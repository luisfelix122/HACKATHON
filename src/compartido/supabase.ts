import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Clave fija de la sesión guardada: la APK la lee sin conexión (docs/contratos.md §Acceso). */
export const CLAVE_SESION = 'ayllu.auth'

type Entorno = { VITE_SUPABASE_URL?: string; VITE_SUPABASE_PUBLISHABLE_KEY?: string }

/** Crea el cliente con la clave publicable; los permisos los imponen las reglas RLS. */
export function crearClienteSupabase(entorno: Entorno): SupabaseClient {
  const url = entorno.VITE_SUPABASE_URL
  const clavePublicable = entorno.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !clavePublicable) {
    throw new Error(
      'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local y complétalas.',
    )
  }
  return createClient(url, clavePublicable, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      storageKey: CLAVE_SESION,
    },
  })
}

let cliente: SupabaseClient | undefined

/**
 * Cliente único de la app. Se crea al primer uso, así una pantalla que no usa
 * Supabase (por ejemplo, «Mis productos» sin conexión) no depende de las variables.
 */
export function obtenerSupabase(): SupabaseClient {
  cliente ??= crearClienteSupabase({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
      string | undefined,
  })
  return cliente
}
