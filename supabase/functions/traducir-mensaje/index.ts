import { createClient } from '@supabase/supabase-js'
import { llamarChatIa } from '../_compartido/ia'
import { armarPrompt, idiomaValido, traducirParaParte, type MensajeTraducible } from './traduccion'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function respuesta(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
type DenoRuntime = {
  env?: { get(nombre: string): string | undefined }
  serve?: (handler: (req: Request) => Promise<Response>) => void
}
const runtime = (globalThis as unknown as { Deno?: DenoRuntime }).Deno
function env(nombre: string) {
  return (
    runtime?.env?.get(nombre) ?? (typeof process !== 'undefined' ? process.env[nombre] : undefined)
  )
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return respuesta({ error: 'metodo_no_permitido' }, 405)
  const authorization = req.headers.get('Authorization')
  if (!authorization?.match(/^Bearer \S+$/))
    return respuesta({ error: 'no_autenticado', mensaje: 'Ingresa para leer este pedido.' }, 401)
  let mensajeId: string, idioma: string
  try {
    const body: unknown = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    const entrada = body as Record<string, unknown>
    if (
      typeof entrada.mensaje_id !== 'string' ||
      !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(entrada.mensaje_id)
    )
      throw new Error()
    mensajeId = entrada.mensaje_id
    idioma = idiomaValido(entrada.idioma)
  } catch {
    return respuesta({ error: 'entrada_invalida', mensaje: 'Revisa el mensaje y el idioma.' }, 400)
  }
  try {
    const url = env('SUPABASE_URL'),
      anon = env('SUPABASE_ANON_KEY'),
      service = env('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anon || !service) throw new Error('ia_no_disponible')
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const {
      data: { user },
      error,
    } = await userClient.auth.getUser()
    if (error || !user)
      return respuesta(
        { error: 'no_autenticado', mensaje: 'Tu sesión expiró. Ingresa nuevamente.' },
        401,
      )
    const admin = createClient(url, service, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    async function leerAutorizado(): Promise<MensajeTraducible | null> {
      // La lectura con el JWT aplica RLS antes de consultar caché o proveedor.
      const { data: mensaje, error } = await userClient
        .from('mensaje_orden')
        .select('id,orden_id,texto_original,texto_traducido')
        .eq('id', mensajeId)
        .maybeSingle()
      if (error) throw new Error('ia_no_disponible')
      if (!mensaje) return null
      const orden = await admin
        .from('orden')
        .select('comprador_id,producto_id')
        .eq('id', mensaje.orden_id)
        .maybeSingle()
      if (orden.error) throw new Error('ia_no_disponible')
      if (!orden.data) return null
      const producto = await admin
        .from('producto')
        .select('artesano_id')
        .eq('id', orden.data.producto_id)
        .maybeSingle()
      if (producto.error) throw new Error('ia_no_disponible')
      if (orden.data.comprador_id !== user!.id && producto.data?.artesano_id !== user!.id)
        return null
      return mensaje as MensajeTraducible
    }
    const texto = await traducirParaParte(
      {
        leerAutorizado,
        async guardarSiIgual(anterior, cache) {
          let consulta = admin
            .from('mensaje_orden')
            .update({ texto_traducido: cache })
            .eq('id', mensajeId)
            .eq('texto_original', anterior.texto_original)
          consulta =
            anterior.texto_traducido === null
              ? consulta.is('texto_traducido', null)
              : consulta.eq('texto_traducido', JSON.stringify(anterior.texto_traducido))
          const { data, error } = await consulta.select('id').maybeSingle()
          if (error) throw new Error('ia_no_disponible')
          return Boolean(data)
        },
      },
      idioma,
      async (original, destino) =>
        llamarChatIa({ modelo: 'ayllu-texto', ...armarPrompt(original, destino) }),
    )
    return respuesta({ texto, idioma })
  } catch (error) {
    if (error instanceof Error && error.message === 'no_es_parte')
      return respuesta(
        { error: 'no_es_parte', mensaje: 'Solo las partes del pedido pueden leer este mensaje.' },
        403,
      )
    return respuesta(
      {
        error: 'ia_no_disponible',
        mensaje: 'No pudimos traducir. Puedes leer el mensaje original.',
      },
      502,
    )
  }
}
if (typeof runtime?.serve === 'function') runtime.serve(handler)
export default handler
