import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { MensajeOrden } from '../compartido/dominio/orden'
import { useSesion } from '../compartido/sesion'
import { obtenerSupabase } from '../compartido/supabase'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { leerMensajes, obtenerOrden, type OrdenDetallada } from './consultas'
import { HiloMensajes } from './HiloMensajes'
import { suscribirOrden } from './tiempoReal'
import './pedidos.css'

export function DetalleOrden() {
  const { id } = useParams()
  const { sesion, cargando } = useSesion()
  const usuario = sesion?.user.id
  const [resultado, setResultado] = useState<{
    clave: string
    orden: OrdenDetallada | null
    mensajes: MensajeOrden[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sinTiempoReal, setSinTiempoReal] = useState(false)
  const [intento, setIntento] = useState(0)
  const clave = `${usuario}:${id}`

  useEffect(() => {
    if (!id || !usuario) return
    let vigente = true
    let peticion = 0
    async function cargar() {
      const numero = ++peticion
      try {
        const [orden, mensajes] = await Promise.all([obtenerOrden(id!), leerMensajes(id!)])
        if (vigente && numero === peticion) {
          setResultado({ clave, orden, mensajes })
          setError(null)
        }
      } catch (causa) {
        if (vigente && numero === peticion)
          setError(causa instanceof Error ? causa.message : 'No pudimos leer el pedido.')
      }
    }
    void cargar()
    let cancelar = () => {}
    try {
      cancelar = suscribirOrden(
        id,
        () => void cargar(),
        (fallo) => {
          if (vigente) setSinTiempoReal(fallo)
        },
      )
    } catch {
      queueMicrotask(() => {
        if (vigente) setSinTiempoReal(true)
      })
    }
    return () => {
      vigente = false
      cancelar()
    }
  }, [id, usuario, clave, intento])

  const actual = resultado?.clave === clave ? resultado : null
  const orden = actual?.orden

  const esComprador = Boolean(sesion?.user.id && orden && sesion.user.id === orden.comprador_id)
  const nombreCliente =
    orden?.comprador?.nombre || orden?.datos_envio?.nombre_destinatario || 'Cliente'
  const telefonoCliente = orden?.comprador?.whatsapp || orden?.datos_envio?.telefono || null
  const nombreOtro = esComprador
    ? orden?.producto?.nombre
      ? `Artesano (${orden.producto.nombre})`
      : 'Artesano'
    : nombreCliente

  const fotoPrincipal =
    orden?.producto?.foto_producto?.find((f) => f.publicada)?.ruta ||
    orden?.producto?.foto_producto?.[0]?.ruta ||
    null
  const fotoUrl = fotoPrincipal
    ? obtenerSupabase().storage.from('fotos').getPublicUrl(fotoPrincipal).data.publicUrl
    : null

  return (
    <main className="pagina pagina-artesano pedidos">
      <div className="pedidos-volver">
        <Link to="/pedidos" className="enlace-volver">
          ← Volver a Mis pedidos
        </Link>
      </div>

      {cargando ? (
        <Aviso>Cargando…</Aviso>
      ) : !sesion ? (
        <Aviso>Ingresa para ver este pedido.</Aviso>
      ) : error ? (
        <Aviso tono="error">
          {error}
          <Boton onClick={() => setIntento((valor) => valor + 1)}>Reintentar</Boton>
        </Aviso>
      ) : !actual ? (
        <Aviso>Cargando…</Aviso>
      ) : !orden ? (
        <Aviso>No encontramos este pedido o no pertenece a tu cuenta.</Aviso>
      ) : (
        <>
          <header className="pedido-cabecera">
            <div>
              <span className={`badge-estado estado-${orden.estado}`}>
                {orden.estado.replaceAll('_', ' ')}
              </span>
              <h1>Pedido #{orden.id.slice(0, 8)}</h1>
              <p className="texto-ayuda">
                Solicitado el{' '}
                {new Date(orden.creado_en).toLocaleString('es-PE', {
                  timeZone: 'America/Lima',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="pedido-acciones">
              <Boton variante="secundario" onClick={() => setIntento((valor) => valor + 1)}>
                Actualizar
              </Boton>
            </div>
          </header>

          {sinTiempoReal && (
            <Aviso tono="alerta">
              La actualización en vivo no está disponible. Toca Actualizar para ver novedades.
            </Aviso>
          )}

          {/* Guía informativa de lo que implica el pedido para el artesano */}
          {!esComprador && (
            <section className="panel pedido-guia-artesano" aria-label="Qué implica este pedido">
              <div className="guia-titulo">
                <h2>Pasos para atender este pedido</h2>
                <p className="texto-ayuda">
                  Un cliente está interesado en comprar tu pieza. Sigue estos pasos para coordinar y
                  concretar la entrega:
                </p>
              </div>
              <ol className="pedido-pasos-lista">
                <li>
                  <strong>1. Revisa los requerimientos:</strong> Verifica la pieza, la cantidad
                  solicitada y notas de personalización si las hubiera.
                </li>
                <li>
                  <strong>2. Coordina en el chat con el cliente:</strong> Confirma disponibilidad,
                  acuerda el plazo de entrega y resuelve cualquier consulta.
                </li>
                <li>
                  <strong>3. Cotiza el envío (si aplica):</strong> Si eligió encomienda, cotiza el
                  flete e infórmalo al comprador en la conversación.
                </li>
                <li>
                  <strong>4. Cierra el acuerdo y pago:</strong> Cuando ambos estén conformes,
                  confirma el acuerdo para iniciar la preparación o despacho.
                </li>
              </ol>
            </section>
          )}

          {/* Información de la Pieza Solicitada */}
          <section className="panel pedido-tarjeta-producto" aria-label="Pieza solicitada">
            <h2>Pieza solicitada</h2>
            <div className="pedido-producto-fila">
              <div className="pedido-producto-foto-contenedor">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={orden.producto?.nombre ?? 'Pieza artesanal'}
                    className="pedido-producto-foto"
                  />
                ) : (
                  <div className="pedido-producto-sin-foto">Sin foto</div>
                )}
              </div>
              <div className="pedido-producto-detalles">
                <h3>{orden.producto?.nombre ?? 'Pieza artesanal'}</h3>
                {orden.producto?.ficha?.tipo_producto && (
                  <span className="badge-tipo">{orden.producto.ficha.tipo_producto}</span>
                )}
                {orden.producto?.precio_final != null && (
                  <p className="pedido-producto-precio">
                    Precio unitario: S/ {orden.producto.precio_final.toFixed(2)}
                  </p>
                )}
                <p className="pedido-producto-cantidad">
                  Cantidad solicitada: <strong>{orden.cantidad} unidad(es)</strong>
                </p>
                {orden.producto?.precio_final != null && (
                  <p className="pedido-producto-subtotal">
                    Subtotal estimado: S/{' '}
                    {(orden.producto.precio_final * orden.cantidad).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Datos del Comprador y Envío */}
          <section className="panel pedido-tarjeta-cliente" aria-label="Datos del comprador">
            <h2>Datos del comprador y entrega</h2>
            <dl className="pedido-datos-grid">
              <dt>Comprador</dt>
              <dd>
                <strong>{nombreCliente}</strong>
              </dd>

              {telefonoCliente && (
                <>
                  <dt>Teléfono / WhatsApp</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${telefonoCliente.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="enlace-contacto-cliente"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>Abrir WhatsApp ({telefonoCliente})</span>
                    </a>
                  </dd>
                </>
              )}

              <dt>Modalidad de entrega</dt>
              <dd>
                <span className={`badge-modalidad modalidad-${orden.modalidad}`}>
                  {orden.modalidad === 'envio' ? 'Envío por encomienda' : 'Recojo en taller'}
                </span>
              </dd>

              <dt>Personalización solicitada</dt>
              <dd>
                {orden.detalle ? (
                  <blockquote className="pedido-cita-detalle">{orden.detalle}</blockquote>
                ) : (
                  <span className="texto-secundario">Sin notas adicionales de personalización</span>
                )}
              </dd>

              {orden.modalidad === 'envio' && orden.datos_envio && (
                <>
                  <dt>Destinatario</dt>
                  <dd>{orden.datos_envio.nombre_destinatario}</dd>
                  <dt>Teléfono de contacto</dt>
                  <dd>{orden.datos_envio.telefono}</dd>
                  <dt>Destino de entrega</dt>
                  <dd>
                    {orden.datos_envio.departamento}, {orden.datos_envio.provincia},{' '}
                    {orden.datos_envio.distrito}
                  </dd>
                  <dt>Agencia de encomienda</dt>
                  <dd>{orden.datos_envio.agencia_destino}</dd>
                  {orden.datos_envio.referencia && (
                    <>
                      <dt>Referencia</dt>
                      <dd>{orden.datos_envio.referencia}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
          </section>

          {/* Resumen del Acuerdo Económico */}
          <section className="panel pedido-acuerdo" aria-label="Acuerdo del pedido">
            <h2>Resumen del acuerdo</h2>
            <dl className="pedido-datos-grid">
              <dt>Total acordado</dt>
              <dd className="monto-destacado">
                {orden.total === null
                  ? 'Pendiente de cotización y acuerdo'
                  : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                      orden.total,
                    )}
              </dd>
              <dt>Costo de envío</dt>
              <dd>
                {orden.costo_envio === null
                  ? 'Pendiente de cotización'
                  : `S/ ${orden.costo_envio.toFixed(2)}`}
              </dd>
              <dt>Fecha estimada de entrega</dt>
              <dd>{orden.fecha_entrega_estimada ?? 'Pendiente de confirmación con el cliente'}</dd>
            </dl>
          </section>

          {/* Conversación / Chat del Pedido */}
          <HiloMensajes
            key={clave}
            ordenId={orden.id}
            usuarioId={sesion.user.id}
            mensajes={actual.mensajes}
            nombreOtro={nombreOtro}
            alEnviar={() => setIntento((valor) => valor + 1)}
          />
        </>
      )}
    </main>
  )
}
