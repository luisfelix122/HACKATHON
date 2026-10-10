import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { supabase } from '../compartido/supabase'

/**
 * Registro con Google dentro de la APK (CC-06). Google bloquea el OAuth en un
 * WebView embebido, así que se abre el navegador del sistema y Supabase vuelve
 * a la app por el deep link `pe.ayllu.artesano://auth` (intent-filter en
 * AndroidManifest.xml). Este módulo solo se importa desde la APK.
 */
export const RETORNO_GOOGLE = 'pe.ayllu.artesano://auth'

export type Retorno = { codigo: string } | { error: string }

/**
 * Lee la URL de retorno. `null` si no es exactamente nuestro deep link
 * (esquema `pe.ayllu.artesano:`, host `auth`, sin ruta). El código solo sirve
 * con el verificador PKCE guardado en esta app, así que uno inyectado no abre
 * sesión; el filtro estricto evita además consumir el flujo con URLs ajenas.
 */
export function leerRetorno(url: string): Retorno | null {
  let destino: URL
  try {
    destino = new URL(url)
  } catch {
    return null
  }
  const ruta = destino.pathname
  if (destino.protocol !== 'pe.ayllu.artesano:' || destino.host !== 'auth') return null
  if (ruta !== '' && ruta !== '/') return null
  const codigo = destino.searchParams.get('code')
  if (codigo) return { codigo }
  return { error: destino.searchParams.get('error') ?? 'sin_codigo' }
}

export async function crearCuentaConGoogle(): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: RETORNO_GOOGLE, skipBrowserRedirect: true },
  })
  if (error) throw error
  if (!data.url) throw new Error('Supabase no devolvió la URL de Google')
  await Browser.open({ url: data.url })
}

/**
 * Escucha el regreso desde Google y fija la sesión. Si Google se cancela o el
 * intercambio falla, cierra el navegador y llama a `alFallar`. Devuelve la
 * función para dejar de escuchar.
 */
export function escucharRetornoDeGoogle(alFallar: () => void): () => void {
  const suscripcion = App.addListener('appUrlOpen', async ({ url }) => {
    const retorno = leerRetorno(url)
    if (!retorno) return
    await Browser.close().catch(() => undefined)
    if ('error' in retorno) return alFallar()
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(retorno.codigo)
      if (error) alFallar()
    } catch {
      alFallar()
    }
  })
  return () => {
    void suscripcion.then((s) => s.remove())
  }
}
