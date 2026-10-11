export class ErrorIaNoDisponible extends Error {
  readonly codigo = 'ia_no_disponible'
  readonly status = 502

  constructor(
    mensaje = 'No pudimos preparar tu producto. Puedes reintentar o completarlo a mano.',
  ) {
    super(mensaje)
    this.name = 'ErrorIaNoDisponible'
  }
}

export interface ConfigIa {
  baseUrl?: string
  apiKey?: string
  timeoutMs?: number
}

interface EntornoDeno {
  env?: { get(key: string): string | undefined }
}

function obtenerVariableEntorno(nombre: string): string | undefined {
  const global = globalThis as unknown as { Deno?: EntornoDeno }
  if (typeof global.Deno?.env?.get === 'function') {
    return global.Deno.env.get(nombre)
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[nombre]
  }
  return undefined
}

export type ContenidoMensaje =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { file_data: string } }

export interface MensajeChat {
  role: string
  content: string | ContenidoMensaje[]
}

export async function llamarChatIa({
  modelo,
  systemPrompt,
  userPrompt,
  imagenBase64,
  imagenMimeType = 'image/jpeg',
  audioBase64,
  audioMimeType = 'audio/webm',
  config,
}: {
  modelo: 'ayllu-texto' | 'ayllu-audio'
  systemPrompt: string
  userPrompt: string
  imagenBase64?: string | null
  imagenMimeType?: string
  audioBase64?: string | null
  audioMimeType?: string
  config?: ConfigIa
}): Promise<string> {
  const baseUrl = config?.baseUrl ?? obtenerVariableEntorno('IA_BASE_URL')
  const apiKey = config?.apiKey ?? obtenerVariableEntorno('IA_API_KEY') ?? ''
  const timeoutMs = config?.timeoutMs ?? (Number(obtenerVariableEntorno('IA_TIMEOUT_MS')) || 8000)

  if (!baseUrl || !baseUrl.trim()) {
    throw new ErrorIaNoDisponible('IA_BASE_URL no está configurada')
  }

  const messages: MensajeChat[] = [{ role: 'system', content: systemPrompt }]

  const userContent: ContenidoMensaje[] = [{ type: 'text', text: userPrompt }]

  if (imagenBase64) {
    const imgUrl = imagenBase64.startsWith('data:')
      ? imagenBase64
      : `data:${imagenMimeType};base64,${imagenBase64}`
    userContent.push({
      type: 'image_url',
      image_url: { url: imgUrl },
    })
  }

  if (audioBase64) {
    const audUrl = audioBase64.startsWith('data:')
      ? audioBase64
      : `data:${audioMimeType};base64,${audioBase64}`
    userContent.push({
      type: 'file',
      file: { file_data: audUrl },
    })
  }

  messages.push({ role: 'user', content: userContent })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/v1/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelo,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new ErrorIaNoDisponible(`Error en proxy LiteLLM: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    if (!content || typeof content !== 'string') {
      throw new ErrorIaNoDisponible('Respuesta de IA sin contenido')
    }

    return content
  } catch (err) {
    if (err instanceof ErrorIaNoDisponible) {
      throw err
    }
    throw new ErrorIaNoDisponible(err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timer)
  }
}

export async function llamarEdicionImagenIa({
  imagenBlob,
  prompt,
  timeoutMs = 45000,
  config,
}: {
  imagenBlob: Blob | File
  prompt: string
  timeoutMs?: number
  config?: ConfigIa
}): Promise<{ b64_json: string }> {
  const baseUrl = config?.baseUrl ?? obtenerVariableEntorno('IA_BASE_URL')
  const apiKey = config?.apiKey ?? obtenerVariableEntorno('IA_API_KEY') ?? ''

  if (!baseUrl || !baseUrl.trim()) {
    throw new Error('IA_BASE_URL no está configurada')
  }

  const formData = new FormData()
  formData.append('model', 'ayllu-imagen')
  formData.append('image', imagenBlob, 'original.jpg')
  formData.append('prompt', prompt)
  formData.append('response_format', 'b64_json')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `${baseUrl.replace(/\/+$/, '')}/v1/images/edits`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`Error en generación de imagen: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const b64 = json.data?.[0]?.b64_json
    if (!b64 || typeof b64 !== 'string') {
      throw new Error('Respuesta de imagen sin datos b64_json')
    }

    return { b64_json: b64 }
  } finally {
    clearTimeout(timer)
  }
}
