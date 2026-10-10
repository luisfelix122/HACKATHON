import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const clavePublica = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !clavePublica) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local y complétalas.',
  )
}

/** Cliente único de Supabase. Solo usa la clave publicable; los permisos los imponen las reglas RLS. */
export const supabase = createClient(url, clavePublica, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true },
})
