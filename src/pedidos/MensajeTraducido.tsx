import { useEffect, useState } from 'react'
import type { MensajeOrden } from '../compartido/dominio/orden'
import { obtenerSupabase } from '../compartido/supabase'
import { useSesion } from '../compartido/sesion'

/** Idioma base del lector (`es-PE` → `es`): coincide con más traducciones guardadas. */
function idiomaDelLector(): string {
  const base = navigator.language.split('-')[0]?.toLowerCase()
  return base && /^[a-z]{2,3}$/.test(base) ? base : 'es'
}

export function MensajeTraducido({
  mensaje,
  usuarioId,
  idioma = idiomaDelLector(),
}: {
  mensaje: MensajeOrden
  usuarioId: string
  idioma?: string
}) {
  const { sesion } = useSesion()
  const [resultado, setResultado] = useState<{ clave: string; texto: string } | null>(null)
  const [original, setOriginal] = useState<string | null>(null)
  // Los mensajes propios ya están en tu idioma: no se traducen.
  const esPropio = mensaje.autor_id === usuarioId
  const cache = mensaje.texto_traducido?.[idioma]
  const guardada = typeof cache === 'string' && cache.trim() && cache.length <= 4000 ? cache : null
  const clave = `${usuarioId}:${mensaje.id}:${mensaje.texto_original}:${idioma}`

  useEffect(() => {
    if (esPropio || sesion?.user.id !== usuarioId || guardada) return
    let vigente = true
    async function traducir() {
      try {
        const { data, error } = await obtenerSupabase().functions.invoke('traducir-mensaje', {
          body: { mensaje_id: mensaje.id, idioma },
        })
        if (
          error ||
          !data ||
          typeof data.texto !== 'string' ||
          !data.texto.trim() ||
          data.texto.length > 4000
        )
          return
        if (vigente) setResultado({ clave, texto: data.texto })
      } catch {
        // Sin traducción se muestra el original, sin avisos: el mensaje sigue legible.
      }
    }
    void traducir()
    return () => {
      vigente = false
    }
  }, [
    esPropio,
    clave,
    guardada,
    idioma,
    mensaje.id,
    usuarioId,
    sesion?.user.id,
    sesion?.access_token,
  ])

  const traduccion = esPropio
    ? null
    : (guardada ?? (resultado?.clave === clave ? resultado.texto : null))
  const traducido = traduccion !== null && traduccion.trim() !== mensaje.texto_original.trim()
  const verOriginal = original === clave

  return (
    <div>
      <p>{traducido && !verOriginal ? traduccion : mensaje.texto_original}</p>
      {traducido && (
        <>
          <small>Traducción automática</small>{' '}
          <button type="button" onClick={() => setOriginal(verOriginal ? null : clave)}>
            {verOriginal ? 'Ver traducción' : 'Ver original'}
          </button>
        </>
      )}
    </div>
  )
}
