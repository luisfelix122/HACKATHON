import { useEffect, useState } from 'react'
import type { MensajeOrden } from '../compartido/dominio/orden'
import { obtenerSupabase } from '../compartido/supabase'
import { useSesion } from '../compartido/sesion'

export function MensajeTraducido({
  mensaje,
  usuarioId,
  idioma = navigator.language,
}: {
  mensaje: MensajeOrden
  usuarioId: string
  idioma?: string
}) {
  const { sesion } = useSesion()
  const [resultado, setResultado] = useState<{
    clave: string
    texto: string
    error: boolean
  } | null>(null)
  const [intento, setIntento] = useState(0)
  const [original, setOriginal] = useState<string | null>(null)
  const cache = mensaje.texto_traducido?.[idioma]
  const guardada = typeof cache === 'string' && cache.trim() && cache.length <= 4000 ? cache : null
  const clave = `${usuarioId}:${mensaje.id}:${mensaje.texto_original}:${idioma}`
  useEffect(() => {
    if (sesion?.user.id !== usuarioId || guardada) return
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
          data.texto.length > 4000 ||
          typeof data.idioma !== 'string' ||
          Intl.getCanonicalLocales(data.idioma)[0] !== Intl.getCanonicalLocales(idioma)[0]
        )
          throw new Error()
        if (vigente) setResultado({ clave, texto: data.texto, error: false })
      } catch {
        if (vigente) setResultado({ clave, texto: mensaje.texto_original, error: true })
      }
    }
    void traducir()
    return () => {
      vigente = false
    }
  }, [
    clave,
    intento,
    guardada,
    idioma,
    mensaje.id,
    mensaje.texto_original,
    usuarioId,
    sesion?.user.id,
    sesion?.access_token,
  ])
  const actual = sesion?.user.id === usuarioId && resultado?.clave === clave ? resultado : null
  const texto = guardada ?? (actual && !actual.error ? actual.texto : mensaje.texto_original)
  const traducido = texto.trim() !== mensaje.texto_original.trim()
  const verOriginal = original === clave
  return (
    <div>
      <p>{traducido && !verOriginal ? texto : mensaje.texto_original}</p>
      {traducido && (
        <>
          <small>Traducción automática</small>{' '}
          <button type="button" onClick={() => setOriginal(verOriginal ? null : clave)}>
            {verOriginal ? 'Ver traducción' : 'Ver original'}
          </button>
        </>
      )}
      {actual?.error && (
        <div>
          <small role="status">No pudimos traducir. Se muestra el original.</small>{' '}
          <button type="button" onClick={() => setIntento((i) => i + 1)}>
            Reintentar traducción
          </button>
        </div>
      )}
    </div>
  )
}
