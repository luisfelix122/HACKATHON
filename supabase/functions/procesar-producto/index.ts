import { createClient } from '@supabase/supabase-js'
import { armarPromptFicha, armarPromptAudio, validarRespuestaIA, type RespuestaIA } from './ficha'
import { procesarVariantesFotos, armarPeticionEdicionImagen, type VarianteFoto } from './fotos'
import { llamarChatIa, llamarEdicionImagenIa, ErrorIaNoDisponible } from '../_compartido/ia'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonRespuesta(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  })
}

interface EntornoDeno {
  env?: { get(key: string): string | undefined }
  serve?: (handler: (req: Request) => Promise<Response>) => void
}

function obtenerEnv(nombre: string): string | undefined {
  const global = globalThis as unknown as { Deno?: EntornoDeno }
  if (typeof global.Deno?.env?.get === 'function') {
    return global.Deno.env.get(nombre)
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[nombre]
  }
  return undefined
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonRespuesta({ error: 'metodo_no_permitido' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonRespuesta(
      {
        error: 'no_autenticado',
        mensaje: 'Debes iniciar sesión para procesar un producto.',
      },
      401,
    )
  }

  let body: { producto_id?: string; mejorar_foto?: boolean }
  try {
    body = await req.json()
  } catch {
    return jsonRespuesta(
      {
        error: 'entrada_invalida',
        mensaje: 'Cuerpo de la petición JSON inválido.',
      },
      400,
    )
  }

  const { producto_id, mejorar_foto } = body
  if (!producto_id || typeof producto_id !== 'string') {
    return jsonRespuesta(
      {
        error: 'entrada_invalida',
        mensaje: 'Se requiere un producto_id válido.',
      },
      400,
    )
  }

  const supabaseUrl = obtenerEnv('SUPABASE_URL') || obtenerEnv('VITE_SUPABASE_URL') || ''
  const supabaseAnonKey =
    obtenerEnv('SUPABASE_ANON_KEY') || obtenerEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || ''
  const supabaseServiceKey = obtenerEnv('SUPABASE_SERVICE_ROLE_KEY') || ''

  if (!supabaseUrl) {
    return jsonRespuesta(
      {
        error: 'ia_no_disponible',
        mensaje: 'No pudimos preparar tu producto. Puedes reintentar o completarlo a mano.',
      },
      502,
    )
  }

  // 1. Verificar usuario autenticado
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser()

  if (authError || !user) {
    return jsonRespuesta(
      {
        error: 'no_autenticado',
        mensaje: 'Sesión no válida o expirada.',
      },
      401,
    )
  }

  // 2. Usar cliente admin para consultas de sistema
  const adminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

  // 3. Cargar producto
  const { data: producto, error: errProducto } = await adminClient
    .from('producto')
    .select('*')
    .eq('id', producto_id)
    .single()

  if (errProducto || !producto) {
    return jsonRespuesta(
      {
        error: 'entrada_invalida',
        mensaje: 'Producto no encontrado.',
      },
      400,
    )
  }

  // Verificar dueño
  if (producto.artesano_id !== user.id) {
    return jsonRespuesta(
      {
        error: 'no_es_dueno',
        mensaje: 'No tienes permiso para modificar este producto.',
      },
      403,
    )
  }

  // Verificar estado
  if (producto.estado !== 'borrador' && producto.estado !== 'en_revision') {
    return jsonRespuesta(
      {
        error: 'estado_invalido',
        mensaje: 'El producto debe estar en borrador o en revisión para ser procesado.',
      },
      409,
    )
  }

  // Verificar límite de llamadas (máximo 3)
  if ((producto.ia_intentos ?? 0) >= 3) {
    return jsonRespuesta(
      {
        error: 'limite_ia',
        mensaje: 'Se superó el límite de intentos de IA para este producto.',
      },
      429,
    )
  }

  // Validar descripción o audio
  const tieneTexto =
    Boolean(producto.descripcion_texto) && producto.descripcion_texto.trim().length > 0
  const tieneAudio = Boolean(producto.audio_ruta) && producto.audio_ruta.trim().length > 0

  if (!tieneTexto && !tieneAudio) {
    return jsonRespuesta(
      {
        error: 'entrada_invalida',
        mensaje: 'El producto debe tener una descripción o un audio grabado.',
      },
      400,
    )
  }

  // Cargar foto original
  const { data: fotoOriginalRegistro, error: errFoto } = await adminClient
    .from('foto_producto')
    .select('*')
    .eq('producto_id', producto_id)
    .eq('origen', 'original')
    .maybeSingle()

  if (errFoto || !fotoOriginalRegistro) {
    return jsonRespuesta(
      {
        error: 'entrada_invalida',
        mensaje: 'El producto no tiene una foto original registrada.',
      },
      400,
    )
  }

  // Descargar foto original de Storage
  const { data: fotoBlob, error: errDescargaFoto } = await adminClient.storage
    .from('fotos')
    .download(fotoOriginalRegistro.ruta)

  if (errDescargaFoto || !fotoBlob) {
    return jsonRespuesta(
      {
        error: 'entrada_invalida',
        mensaje: 'No se pudo cargar la foto original desde el almacenamiento.',
      },
      400,
    )
  }

  const fotoBuffer = await fotoBlob.arrayBuffer()
  const fotoBase64 = arrayBufferToBase64(fotoBuffer)

  // Descargar audio si no hay texto
  let audioBase64: string | null = null
  let audioMimeType = 'audio/webm'
  if (!tieneTexto && tieneAudio) {
    const rutaAudio = producto.audio_ruta
    const ext = rutaAudio.split('.').pop()?.toLowerCase() || ''
    const formatosCompatibles = ['webm', 'ogg', 'mp3', 'm4a', 'wav']
    if (!formatosCompatibles.includes(ext)) {
      return jsonRespuesta(
        {
          error: 'entrada_invalida',
          mensaje: 'Dicta o escribe la descripción',
        },
        400,
      )
    }
    audioMimeType = ext === 'ogg' ? 'audio/ogg' : `audio/${ext}`

    const { data: audioBlob, error: errAudio } = await adminClient.storage
      .from('audios')
      .download(rutaAudio)

    if (errAudio || !audioBlob) {
      return jsonRespuesta(
        {
          error: 'entrada_invalida',
          mensaje: 'No se pudo cargar el audio grabado.',
        },
        400,
      )
    }
    const audioBuffer = await audioBlob.arrayBuffer()
    audioBase64 = arrayBufferToBase64(audioBuffer)
  }

  // 4. Cambiar estado a 'procesando' e incrementar ia_intentos
  const nuevoIntento = (producto.ia_intentos ?? 0) + 1
  const { error: errProcesando } = await adminClient
    .from('producto')
    .update({
      estado: 'procesando',
      ia_intentos: nuevoIntento,
    })
    .eq('id', producto_id)

  if (errProcesando) {
    return jsonRespuesta(
      {
        error: 'ia_no_disponible',
        mensaje: 'No pudimos iniciar el procesamiento de tu producto.',
      },
      502,
    )
  }

  // 5. Preparar prompts para IA
  const promptData =
    !tieneTexto && tieneAudio
      ? armarPromptAudio({
          nombre: producto.nombre,
          costeo: producto.costeo,
          precioFinal: producto.precio_final,
        })
      : armarPromptFicha({
          nombre: producto.nombre,
          descripcionTexto: producto.descripcion_texto,
          costeo: producto.costeo,
          precioFinal: producto.precio_final,
        })

  const modeloChat = !tieneTexto && tieneAudio ? 'ayllu-audio' : 'ayllu-texto'

  // Función interna para llamar y validar con reintento (máximo 1 reintento)
  async function ejecutarLlamadaIaConReintento(): Promise<RespuestaIA> {
    let ultimoError: unknown = null
    for (let intento = 0; intento < 2; intento++) {
      try {
        const contenido = await llamarChatIa({
          modelo: modeloChat,
          systemPrompt: promptData.system,
          userPrompt: promptData.user,
          imagenBase64: fotoBase64,
          audioBase64,
          audioMimeType,
        })
        const respuestaValidada = validarRespuestaIA(contenido)
        return respuestaValidada
      } catch (err) {
        ultimoError = err
      }
    }
    throw ultimoError || new ErrorIaNoDisponible()
  }

  let respuestaIa: RespuestaIA
  try {
    respuestaIa = await ejecutarLlamadaIaConReintento()
  } catch (err) {
    const mensajeError = err instanceof Error ? err.message : 'Error en procesamiento IA'
    await adminClient
      .from('producto')
      .update({
        estado: 'borrador',
        ia_error: mensajeError,
      })
      .eq('id', producto_id)

    return jsonRespuesta(
      {
        error: 'ia_no_disponible',
        mensaje: 'No pudimos preparar tu producto. Puedes reintentar o completarlo a mano.',
      },
      502,
    )
  }

  // 6. Evaluar si es artesanía y si el contenido es apropiado
  if (!respuestaIa.evaluacion.es_artesania) {
    const motivo =
      respuestaIa.evaluacion.motivo ||
      'Esta pieza parece industrial. Si la hiciste tú, toma otra foto que muestre el trabajo a mano.'
    await adminClient
      .from('producto')
      .update({
        estado: 'borrador',
        revision_ia: 'rechazada',
        ia_error: motivo,
      })
      .eq('id', producto_id)

    return jsonRespuesta(
      {
        error: 'no_es_artesania',
        mensaje:
          'Esta pieza parece industrial. Si la hiciste tú, toma otra foto que muestre el trabajo a mano.',
      },
      422,
    )
  }

  if (!respuestaIa.evaluacion.contenido_apropiado) {
    const motivo = respuestaIa.evaluacion.motivo || 'Contenido ofensivo o no permitido.'
    await adminClient
      .from('producto')
      .update({
        estado: 'borrador',
        revision_ia: 'rechazada',
        ia_error: motivo,
      })
      .eq('id', producto_id)

    return jsonRespuesta(
      {
        error: 'contenido_no_permitido',
        mensaje: motivo,
      },
      422,
    )
  }

  // 7. Si fue aprobada por la IA, procesar fotos opcionales
  const advertencias: string[] = []
  const fotosIaGuardadas: Array<{
    id: string
    variante: VarianteFoto
    ruta: string
  }> = []

  if (mejorar_foto) {
    // Eliminar variantes anteriores si existían
    await adminClient
      .from('foto_producto')
      .delete()
      .eq('producto_id', producto_id)
      .eq('origen', 'ia')

    const resultadoVariantes = await procesarVariantesFotos(async (variante) => {
      const peticion = armarPeticionEdicionImagen({
        imagenBlob: fotoBlob,
        variante,
      })
      const res = await llamarEdicionImagenIa({
        imagenBlob: peticion.get('image') as Blob,
        prompt: peticion.get('prompt') as string,
      })
      return { base64: res.b64_json }
    })

    advertencias.push(...resultadoVariantes.advertencias)

    for (let i = 0; i < resultadoVariantes.fotosExitosas.length; i++) {
      const { variante, base64 } = resultadoVariantes.fotosExitosas[i]!
      const rutaIa = `${producto.artesano_id}/${producto_id}/ia-${variante}.png`
      const bytes = base64ToUint8Array(base64)

      const { error: errUpload } = await adminClient.storage.from('fotos').upload(rutaIa, bytes, {
        contentType: 'image/png',
        upsert: true,
      })

      if (errUpload) {
        advertencias.push(`No se pudo guardar la foto «${variante}».`)
        continue
      }

      const idFoto = crypto.randomUUID()
      const { error: errInsertFoto } = await adminClient.from('foto_producto').insert({
        id: idFoto,
        producto_id,
        origen: 'ia',
        variante,
        ruta: rutaIa,
        publicada: false,
        posicion: i + 1,
      })

      if (!errInsertFoto) {
        fotosIaGuardadas.push({
          id: idFoto,
          variante,
          ruta: rutaIa,
        })
      }
    }
  }

  // 8. Actualizar producto a 'en_revision' con ficha y comentario
  const { error: errActualizar } = await adminClient
    .from('producto')
    .update({
      estado: 'en_revision',
      ficha: respuestaIa.ficha,
      revision_ia: 'aprobada',
      comentario_precio_ia: respuestaIa.comentario_precio,
      ia_error: null,
    })
    .eq('id', producto_id)

  if (errActualizar) {
    return jsonRespuesta(
      {
        error: 'ia_no_disponible',
        mensaje:
          'No pudimos guardar la ficha del producto. Puedes reintentar o completarlo a mano.',
      },
      502,
    )
  }

  return jsonRespuesta(
    {
      estado: 'en_revision',
      ficha: respuestaIa.ficha,
      evaluacion: respuestaIa.evaluacion,
      comentario_precio: respuestaIa.comentario_precio,
      fotos_ia: fotosIaGuardadas,
      advertencias,
    },
    200,
  )
}

const globalDeno = (globalThis as unknown as { Deno?: EntornoDeno }).Deno
if (typeof globalDeno?.serve === 'function') {
  globalDeno.serve(handler)
}

export default handler
