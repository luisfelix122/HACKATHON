import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { MensajeOrden, Orden } from '../compartido/dominio/orden'
import { useSesion } from '../compartido/sesion'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { leerMensajes, obtenerOrden } from './consultas'
import { HiloMensajes } from './HiloMensajes'
import { suscribirOrden } from './tiempoReal'
import './pedidos.css'

export function DetalleOrden() {
  const { id } = useParams()
  const { sesion, cargando } = useSesion()
  const usuario = sesion?.user.id
  const [resultado, setResultado] = useState<{
    clave: string
    orden: Orden | null
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
  return (
    <main className="pagina pagina-artesano pedidos">
      <Link to="/pedidos">Mis pedidos</Link>
      <h1>Tu pedido</h1>
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
      ) : !actual.orden ? (
        <Aviso>No encontramos este pedido o no pertenece a tu cuenta.</Aviso>
      ) : (
        <>
          <div className="pedido-acciones">
            <Boton variante="secundario" onClick={() => setIntento((valor) => valor + 1)}>
              Actualizar
            </Boton>
          </div>
          {sinTiempoReal && (
            <Aviso tono="alerta">
              La actualización en vivo no está disponible. Toca Actualizar para ver novedades.
            </Aviso>
          )}
          <section className="pedido-acuerdo" aria-label="Datos del pedido">
            <h2>{actual.orden.estado.replaceAll('_', ' ')}</h2>
            <dl>
              <dt>Cantidad</dt>
              <dd>{actual.orden.cantidad}</dd>
              <dt>Modalidad</dt>
              <dd>
                {actual.orden.modalidad === 'envio'
                  ? 'Envío por agencia'
                  : 'Recojo en casa del artesano'}
              </dd>
              <dt>Personalización</dt>
              <dd>{actual.orden.detalle ?? 'Sin detalle adicional'}</dd>
              <dt>Total</dt>
              <dd>
                {actual.orden.total === null
                  ? 'Pendiente de cotización'
                  : new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                      actual.orden.total,
                    )}
              </dd>
              <dt>Costo de envío</dt>
              <dd>
                {actual.orden.costo_envio === null
                  ? 'Sin cotización de envío'
                  : `S/ ${actual.orden.costo_envio.toFixed(2)}`}
              </dd>
              <dt>Fecha estimada</dt>
              <dd>{actual.orden.fecha_entrega_estimada ?? 'Pendiente de confirmación'}</dd>
              {actual.orden.datos_envio && (
                <>
                  <dt>Destinatario</dt>
                  <dd>{actual.orden.datos_envio.nombre_destinatario}</dd>
                  <dt>Teléfono</dt>
                  <dd>{actual.orden.datos_envio.telefono}</dd>
                  <dt>Destino</dt>
                  <dd>
                    {actual.orden.datos_envio.departamento}, {actual.orden.datos_envio.provincia},{' '}
                    {actual.orden.datos_envio.distrito}
                  </dd>
                  <dt>Agencia</dt>
                  <dd>{actual.orden.datos_envio.agencia_destino}</dd>
                  {actual.orden.datos_envio.referencia && (
                    <>
                      <dt>Referencia</dt>
                      <dd>{actual.orden.datos_envio.referencia}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
          </section>
          <HiloMensajes
            key={clave}
            ordenId={actual.orden.id}
            usuarioId={sesion.user.id}
            mensajes={actual.mensajes}
            alEnviar={() => setIntento((valor) => valor + 1)}
          />
        </>
      )}
    </main>
  )
}
