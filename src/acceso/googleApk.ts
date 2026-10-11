import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import type { PluginListenerHandle } from '@capacitor/core'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ErrorSesion } from '../compartido/sesion'
import { obtenerSupabase } from '../compartido/supabase'

const RETORNO = 'pe.ayllu.artesano://auth'
const ERROR = 'Google no volvió a la app. Revisa tu conexión y vuelve a intentarlo.'
let enCurso = false

function codigoRetorno(url: string): string | null {
  // Comparación textual además del parseo: sin rutas, puertos, credenciales ni fragmentos.
  if (!url.startsWith(`${RETORNO}?`)) return null
  const retorno = new URL(url)
  if (
    retorno.origin !== 'null' ||
    retorno.host !== 'auth' ||
    retorno.pathname !== '' ||
    retorno.hash
  )
    return null
  const codigos = retorno.searchParams.getAll('code')
  return codigos.length === 1 && codigos[0] ? codigos[0] : null
}

export async function completarGoogle(
  url: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<boolean> {
  const codigo = codigoRetorno(url)
  if (!codigo) return false
  const { data, error } = await cliente.auth.exchangeCodeForSession(codigo)
  if (error || !data.session) throw new ErrorSesion(ERROR)
  return true
}

export async function iniciarGoogleApk(cliente: SupabaseClient = obtenerSupabase()): Promise<void> {
  if (enCurso) throw new ErrorSesion('El ingreso con Google ya está en curso.')
  enCurso = true
  const escuchas: PluginListenerHandle[] = []
  let temporizador: ReturnType<typeof setTimeout> | undefined
  try {
    let resolver!: () => void
    let rechazar!: (error: ErrorSesion) => void
    const resultado = new Promise<void>((resolve, reject) => {
      resolver = resolve
      rechazar = reject
    })
    // Evita un rechazo sin consumidor mientras se instala la escucha y abre el navegador.
    void resultado.catch(() => undefined)
    let canjeando = false
    escuchas.push(
      await App.addListener('appUrlOpen', ({ url }) => {
        if (!url.startsWith(`${RETORNO}?`) || canjeando) return
        canjeando = true
        void completarGoogle(url, cliente)
          .then((completo) => {
            if (completo) resolver()
            else rechazar(new ErrorSesion(ERROR))
          })
          .catch(() => rechazar(new ErrorSesion(ERROR)))
      }),
    )
    escuchas.push(
      await Browser.addListener('browserFinished', () => {
        if (!canjeando) rechazar(new ErrorSesion(ERROR))
      }),
    )
    const { data, error } = await cliente.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: RETORNO, skipBrowserRedirect: true },
    })
    if (error || !data.url) throw new ErrorSesion(ERROR)
    temporizador = setTimeout(() => rechazar(new ErrorSesion(ERROR)), 120000)
    await Browser.open({ url: data.url })
    await resultado
  } catch {
    throw new ErrorSesion(ERROR)
  } finally {
    enCurso = false
    clearTimeout(temporizador)
    await Promise.allSettled(escuchas.map((escucha) => escucha.remove()))
    await Browser.close().catch(() => undefined)
  }
}
