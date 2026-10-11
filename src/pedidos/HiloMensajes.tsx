import { useRef, useState, type FormEvent } from 'react'
import type { MensajeOrden } from '../compartido/dominio/orden'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { enviarMensaje } from './consultas'
import { validarMensaje } from './datosEnvio'

export function HiloMensajes({
  ordenId,
  usuarioId,
  mensajes,
  alEnviar,
}: {
  ordenId: string
  usuarioId: string
  mensajes: MensajeOrden[]
  alEnviar: () => void
}) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const bloqueo = useRef(false)
  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (bloqueo.current) return
    const invalido = validarMensaje(texto)
    setError(invalido)
    if (invalido) return
    bloqueo.current = true
    setEnviando(true)
    try {
      await enviarMensaje(ordenId, texto)
      setTexto('')
      alEnviar()
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos enviar tu mensaje. Reintenta.')
    } finally {
      bloqueo.current = false
      setEnviando(false)
    }
  }
  return (
    <section className="pedido-hilo-seccion" aria-label="Hilo del pedido">
      <h2>Hablar sobre este pedido</h2>
      <p className="texto-secundario">
        Acuerden los detalles aquí. El total y el destino válidos son los que aparecen en el pedido.
      </p>
      <ol className="pedido-hilo" aria-live="polite" aria-relevant="additions text">
        {mensajes.map((mensaje) => (
          <li key={mensaje.id} data-propio={mensaje.autor_id === usuarioId}>
            <strong>{mensaje.autor_id === usuarioId ? 'Tú' : 'La otra parte'}</strong>
            <p>{mensaje.texto_original}</p>
            <time dateTime={mensaje.creado_en}>
              {new Date(mensaje.creado_en).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
            </time>
          </li>
        ))}
      </ol>
      {mensajes.length === 0 && <p>Aún no hay mensajes. Escribe para coordinar el pedido.</p>}
      <form className="pedido-hilo-formulario" onSubmit={(evento) => void enviar(evento)}>
        <Campo etiqueta="Mensaje" ayuda="Entre 1 y 1000 caracteres." error={error ?? undefined}>
          {(atributos) => (
            <textarea
              {...atributos}
              required
              maxLength={1000}
              disabled={enviando}
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
            />
          )}
        </Campo>
        <Boton type="submit" icono="mensaje" cargando={enviando}>
          Enviar mensaje
        </Boton>
      </form>
      {error && <Aviso tono="error">{error}</Aviso>}
    </section>
  )
}
