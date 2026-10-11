import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DatosEnvio, Modalidad } from '../compartido/dominio/orden'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { Modal } from '../compartido/ui/Modal'
import { SelectorUbicacion } from '../compartido/ui/SelectorUbicacion'
import { crearOrden } from './consultas'
import { CAMPOS_ENVIO, validarDatosEnvio, validarPedido } from './datosEnvio'

const ETIQUETAS: Record<(typeof CAMPOS_ENVIO)[number] | 'referencia', [string, string]> = {
  nombre_destinatario: ['Nombre del destinatario', 'La persona que recogerá el paquete.'],
  telefono: ['Teléfono', 'Un número para avisar cuando llegue el paquete.'],
  dni: ['DNI del destinatario', 'Ocho dígitos, incluido cualquier cero inicial.'],
  departamento: ['Departamento', 'El departamento de destino.'],
  provincia: ['Provincia', 'La provincia de destino.'],
  distrito: ['Distrito', 'El distrito de destino.'],
  agencia_destino: [
    'Agencia de destino',
    'Nombre o ubicación de la agencia donde recogerás el paquete.',
  ],
  referencia: ['Referencia (opcional)', 'Una indicación que ayude a encontrar la agencia.'],
}
export function FormularioPedido({
  productoId,
  alCerrar,
  abierto = true,
}: {
  productoId: string
  abierto?: boolean
  alCerrar: () => void
}) {
  const navegar = useNavigate()
  const [cantidad, setCantidad] = useState('1')
  const [detalle, setDetalle] = useState('')
  const [modalidad, setModalidad] = useState<Modalidad>('recojo')
  const [datos, setDatos] = useState<Record<string, string>>({})
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const bloqueo = useRef(false)
  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (bloqueo.current) return
    const despacho = modalidad === 'envio' ? (datos as DatosEnvio) : null
    const campos = modalidad === 'envio' ? validarDatosEnvio(datos) : {}
    setErrores(campos)
    const entrada = { cantidad: Number(cantidad), modalidad, datos_envio: despacho, detalle }
    const invalido = validarPedido(entrada)
    setError(invalido)
    if (invalido) return
    bloqueo.current = true
    setEnviando(true)
    try {
      const orden = await crearOrden(productoId, entrada)
      navegar(`/pedidos/${orden.id}`)
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos enviar el pedido. Reintenta.')
    } finally {
      bloqueo.current = false
      setEnviando(false)
    }
  }
  return (
    <Modal abierto={abierto} titulo="Solicitar pedido" alCerrar={alCerrar} ocupado={enviando}>
      <section className="pedido-formulario">
        <p>Es una solicitud: el artesano confirmará el total y la fecha. No reserva la pieza.</p>
        <form onSubmit={(evento) => void enviar(evento)}>
          <fieldset disabled={enviando}>
            <legend>Tu pedido</legend>
            <Campo etiqueta="Cantidad">
              {(atributos) => (
                <input
                  {...atributos}
                  type="number"
                  min="1"
                  max="2147483647"
                  step="1"
                  required
                  value={cantidad}
                  onChange={(evento) => setCantidad(evento.target.value)}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Detalle de personalización (opcional)"
              ayuda="Describe qué necesitas, hasta 1000 caracteres."
            >
              {(atributos) => (
                <textarea
                  {...atributos}
                  maxLength={1000}
                  value={detalle}
                  onChange={(evento) => setDetalle(evento.target.value)}
                />
              )}
            </Campo>
            <Campo etiqueta="Cómo recibirás la pieza">
              {(atributos) => (
                <select
                  {...atributos}
                  value={modalidad}
                  onChange={(evento) => setModalidad(evento.target.value as Modalidad)}
                >
                  <option value="recojo">Recojo en casa del artesano</option>
                  <option value="envio">Envío por agencia</option>
                </select>
              )}
            </Campo>
            {modalidad === 'envio' && (
              <fieldset>
                <legend>Datos de envío</legend>
                <p>Ingresa el DNI de la persona que recogerá el paquete.</p>
                <SelectorUbicacion
                  valor={{
                    departamento: datos.departamento ?? '',
                    provincia: datos.provincia ?? '',
                    distrito: datos.distrito ?? '',
                  }}
                  errores={errores}
                  alCambiar={(destino) => setDatos((previos) => ({ ...previos, ...destino }))}
                />
                {(
                  [
                    ...CAMPOS_ENVIO.filter(
                      (campo) => !['departamento', 'provincia', 'distrito'].includes(campo),
                    ),
                    'referencia',
                  ] as const
                ).map((campo) => (
                  <Campo
                    key={campo}
                    etiqueta={ETIQUETAS[campo][0]}
                    ayuda={ETIQUETAS[campo][1]}
                    error={errores[campo]}
                  >
                    {(atributos) => (
                      <input
                        {...atributos}
                        type={campo === 'telefono' ? 'tel' : 'text'}
                        inputMode={campo === 'dni' ? 'numeric' : undefined}
                        pattern={campo === 'dni' ? '[0-9]{8}' : undefined}
                        minLength={campo === 'dni' ? 8 : undefined}
                        maxLength={campo === 'dni' ? 8 : undefined}
                        required={campo !== 'referencia'}
                        value={datos[campo] ?? ''}
                        onChange={(evento) =>
                          setDatos((previos) => ({ ...previos, [campo]: evento.target.value }))
                        }
                      />
                    )}
                  </Campo>
                ))}
              </fieldset>
            )}
          </fieldset>
          {error && <Aviso tono="error">{error}</Aviso>}
          <div className="pedido-acciones">
            <Boton type="submit" variante="destacado" icono="pedidos" cargando={enviando}>
              Solicitar pedido
            </Boton>
            <Boton variante="secundario" icono="cerrar" disabled={enviando} onClick={alCerrar}>
              Cerrar formulario
            </Boton>
          </div>
        </form>
      </section>
    </Modal>
  )
}
