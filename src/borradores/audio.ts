import { Network } from '@capacitor/network'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'

/**
 * Determina el mejor tipo MIME compatible para grabación con MediaRecorder.
 */
export function obtenerMimeTypeAudio(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/webm'
  }
  const formatos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg']
  for (const f of formatos) {
    if (MediaRecorder.isTypeSupported(f)) {
      return f
    }
  }
  return ''
}

export interface GrabacionControl {
  detener: () => Promise<{ blob: Blob; mimeType: string }>
  cancelar: () => void
}

/**
 * Inicia la grabación de voz usando MediaRecorder y el micrófono del dispositivo.
 */
export async function iniciarGrabacion(): Promise<GrabacionControl> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('El dispositivo no soporta grabación de audio')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = obtenerMimeTypeAudio()
  const opciones = mimeType ? { mimeType } : undefined
  const recorder = new MediaRecorder(stream, opciones)
  const fragmentos: Blob[] = []

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      fragmentos.push(e.data)
    }
  }

  recorder.start(250)

  const detener = (): Promise<{ blob: Blob; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        try {
          stream.getTracks().forEach((track) => track.stop())
          const tipoFinal = recorder.mimeType || mimeType || 'audio/webm'
          const blobFinal = new Blob(fragmentos, { type: tipoFinal })
          resolve({ blob: blobFinal, mimeType: tipoFinal })
        } catch (err) {
          reject(err)
        }
      }

      recorder.onerror = (e) => {
        stream.getTracks().forEach((track) => track.stop())
        reject(e)
      }

      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    })
  }

  const cancelar = () => {
    stream.getTracks().forEach((track) => track.stop())
    if (recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  return { detener, cancelar }
}

/**
 * Inicia el dictado por voz transcribiendo en vivo con SpeechRecognition.
 * Si 'es-PE' no está disponible o falla, utiliza 'es-ES' como respaldo.
 */
export async function iniciarDictado(
  alRecibirTexto: (texto: string) => void,
): Promise<() => Promise<void>> {
  const perm = await SpeechRecognition.requestPermissions()
  if (perm.speechRecognition !== 'granted') {
    throw new Error('Permiso de reconocimiento de voz no concedido')
  }

  let handleListener: { remove: () => Promise<void> } | null = null

  try {
    handleListener = await SpeechRecognition.addListener(
      'partialResults',
      (data: { matches: string[] }) => {
        const coincidencia = data.matches?.[0]
        if (coincidencia) {
          alRecibirTexto(coincidencia)
        }
      },
    )

    try {
      await SpeechRecognition.start({
        language: 'es-PE',
        partialResults: true,
        popup: false,
      })
    } catch {
      // Respaldo en español general si la variante peruana no está instalada en el dispositivo
      await SpeechRecognition.start({
        language: 'es-ES',
        partialResults: true,
        popup: false,
      })
    }
  } catch (error) {
    if (handleListener) {
      await handleListener.remove()
    }
    throw error
  }

  return async () => {
    try {
      await SpeechRecognition.stop()
    } catch {
      // Ignorar error si ya estaba detenido
    }
    if (handleListener) {
      await handleListener.remove()
    }
  }
}

/**
 * Verifica si el dispositivo cuenta con conexión a internet activa.
 */
export async function hayConexion(): Promise<boolean> {
  try {
    const estado = await Network.getStatus()
    return estado.connected
  } catch {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }
}

/**
 * Escucha cambios en el estado de la red para alternar acciones con o sin señal.
 */
export function escucharRed(alCambiarConexion: (conectado: boolean) => void): () => void {
  let removerListener: (() => void) | null = null

  Network.addListener('networkStatusChange', (estado) => {
    alCambiarConexion(estado.connected)
  })
    .then((handle) => {
      removerListener = () => {
        handle.remove()
      }
    })
    .catch(() => {
      // Fallback a eventos estándar del navegador
      const enLinea = () => alCambiarConexion(true)
      const fueraLinea = () => alCambiarConexion(false)
      window.addEventListener('online', enLinea)
      window.addEventListener('offline', fueraLinea)
      removerListener = () => {
        window.removeEventListener('online', enLinea)
        window.removeEventListener('offline', fueraLinea)
      }
    })

  return () => {
    if (removerListener) {
      removerListener()
    }
  }
}
