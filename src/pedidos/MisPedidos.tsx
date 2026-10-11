import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  emitirNotificacionPush,
  solicitarPermisoNotificaciones,
} from '../compartido/notificaciones/servicio'
import { useSesion } from '../compartido/sesion'
import { obtenerSupabase } from '../compartido/supabase'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { listarOrdenes, type OrdenDetallada } from './consultas'
import { suscribirNuevosPedidos } from './tiempoReal'
import './pedidos.css'

export function MisPedidos() {
  const { sesion, cargando } = useSesion()
  const ubicacion = useLocation()
  const [resultado, setResultado] = useState<{
    usuario: string
    ordenes: OrdenDetallada[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const [alertaNuevo, setAlertaNuevo] = useState<string | null>(null)
  const id = sesion?.user.id

  useEffect(() => {
    void solicitarPermisoNotificaciones()
  }, [])

  useEffect(() => {
    if (!id) return
    let vigente = true
    listarOrdenes()
      .then((ordenes) => {
        if (vigente) {
          setResultado({ usuario: id, ordenes })
          setError(null)
        }
      })
      .catch((causa: unknown) => {
        if (vigente)
          setError(causa instanceof Error ? causa.message : 'No pudimos leer tus pedidos.')
      })
    return () => {
      vigente = false
    }
  }, [id, intento])

  // Escuchar nuevos pedidos en tiempo real y disparar notificación push
  useEffect(() => {
    if (!id) return
    const cancelar = suscribirNuevosPedidos((nuevaOrden) => {
      void emitirNotificacionPush({
        titulo: 'Nuevo pedido recibido',
        cuerpo:
          'Un cliente acaba de solicitar una de tus piezas artesanales. Toca para ver los detalles.',
        tipo: 'pedido',
        ordenId: nuevaOrden?.id,
      })
      setAlertaNuevo('¡Nuevo pedido recibido! La lista de pedidos ha sido actualizada.')
      setIntento((val) => val + 1)
    })
    return () => cancelar()
  }, [id])

  const ordenes = resultado?.ordenes ?? []
  const pendientesConteo = ordenes.filter((o) => o.estado === 'solicitada').length

  return (
    <main className="pagina pagina-artesano pedidos">
      <header className="cabecera-pedidos">
        <div>
          <h1>Mis pedidos</h1>
          <p className="texto-ayuda">
            Gestiona los pedidos de tus clientes, coordina la entrega en el chat y confirma los
            acuerdos.
          </p>
        </div>
        <div>
          <Boton variante="secundario" onClick={() => setIntento((valor) => valor + 1)}>
            Actualizar
          </Boton>
        </div>
      </header>

      {alertaNuevo && (
        <Aviso tono="exito">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <span>{alertaNuevo}</span>
            <button
              type="button"
              className="boton-cerrar-alerta"
              aria-label="Cerrar aviso"
              onClick={() => setAlertaNuevo(null)}
            >
              Cerrar
            </button>
          </div>
        </Aviso>
      )}

      {pendientesConteo > 0 && (
        <div className="panel aviso-pedidos-pendientes">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radio, 10px)',
              backgroundColor: 'var(--arena)',
              color: 'var(--pacifico-hondo)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <strong>
              Tienes {pendientesConteo} {pendientesConteo === 1 ? 'pedido nuevo' : 'pedidos nuevos'}{' '}
              por atender.
            </strong>
            <p>
              Ingresa al pedido para revisar las notas del cliente, chatear y coordinar los detalles
              de entrega.
            </p>
          </div>
        </div>
      )}

      {cargando ? (
        <Aviso>Cargando…</Aviso>
      ) : !sesion ? (
        <Aviso>
          Ingresa para ver tus pedidos.{' '}
          {import.meta.env.MODE === 'web' && (
            <Link to={`/ingresar?volver=${encodeURIComponent(ubicacion.pathname)}`}>Ingresar</Link>
          )}
        </Aviso>
      ) : error ? (
        <Aviso tono="error">
          {error} <Boton onClick={() => setIntento((valor) => valor + 1)}>Reintentar</Boton>
        </Aviso>
      ) : !resultado || resultado.usuario !== id ? (
        <Aviso>Cargando…</Aviso>
      ) : ordenes.length === 0 ? (
        <div className="panel vacio-contenedor">
          <p className="vacio">Aún no tienes pedidos.</p>
          <p className="texto-ayuda" style={{ textAlign: 'center', maxWidth: '28rem' }}>
            {import.meta.env.MODE === 'web'
              ? 'Cuando solicites piezas de los artesanos aparecerán aquí.'
              : 'Cuando un comprador solicite una de tus artesanías en la vitrina, aparecerá aquí con los datos del cliente para que puedan coordinar.'}
          </p>
          {import.meta.env.MODE === 'web' && (
            <div className="vacio-accion">
              <Link to="/" className="boton boton-destacado">
                Explorar artesanías
              </Link>
            </div>
          )}
        </div>
      ) : (
        <ul className="pedidos-tarjetas-lista">
          {ordenes.map((orden) => {
            const nombreProducto = orden.producto?.nombre ?? 'Pieza artesanal'
            const nombreComprador =
              orden.comprador?.nombre || orden.datos_envio?.nombre_destinatario || 'Cliente'
            const fotoPrincipal =
              orden.producto?.foto_producto?.find((f) => f.publicada)?.ruta ||
              orden.producto?.foto_producto?.[0]?.ruta
            const fotoUrl = fotoPrincipal
              ? obtenerSupabase().storage.from('fotos').getPublicUrl(fotoPrincipal).data.publicUrl
              : null

            return (
              <li key={orden.id} className="tarjeta-pedido panel">
                <div className="pedido-item-cabecera">
                  <span className={`badge-estado estado-${orden.estado}`}>
                    {orden.estado.replaceAll('_', ' ')}
                  </span>
                  <time dateTime={orden.creado_en}>
                    {new Date(orden.creado_en).toLocaleDateString('es-PE', {
                      timeZone: 'America/Lima',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>

                <div className="pedido-item-cuerpo">
                  <div className="pedido-item-foto-wrap">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={nombreProducto} className="pedido-item-foto" />
                    ) : (
                      <div className="pedido-item-sin-foto">Sin foto</div>
                    )}
                  </div>
                  <div className="pedido-item-info">
                    <h2 className="pedido-item-titulo">{nombreProducto}</h2>
                    <p className="pedido-item-comprador">
                      <strong>Cliente:</strong> {nombreComprador}
                    </p>
                    <p className="pedido-item-detalles">
                      {orden.cantidad} unidad(es) ·{' '}
                      <span className={`badge-modalidad modalidad-${orden.modalidad}`}>
                        {orden.modalidad === 'envio' ? 'Envío por encomienda' : 'Recojo en taller'}
                      </span>
                    </p>
                    {orden.total != null ? (
                      <p className="pedido-item-total">Total: S/ {orden.total.toFixed(2)}</p>
                    ) : (
                      <p className="pedido-item-total pendiente">Pendiente de cotización</p>
                    )}
                  </div>
                </div>

                <div className="pedido-item-acciones">
                  <Link
                    to={`/pedidos/${orden.id}`}
                    className="boton boton-destacado boton-abrir-pedido"
                  >
                    Ver pedido y coordinar
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
