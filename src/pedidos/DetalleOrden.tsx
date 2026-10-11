import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { MensajeOrden, Orden } from '../compartido/dominio/orden'
import { useSesion } from '../compartido/sesion'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { leerMensajes, obtenerOrden } from './consultas'
import { HiloMensajes } from './HiloMensajes'
import { suscribirOrden } from './tiempoReal'
import { AccionesArtesano } from './AccionesArtesano'
import { AccionesComprador } from './AccionesComprador'
import { leerContextoAcciones, type ContextoAcciones } from './acciones'
import { etiquetaEstado } from './estadoOrden'
import { mostrarFecha } from './estimarEntrega'
import './pedidos.css'

export function DetalleOrden() {
  const { id } = useParams()
  const { sesion, cargando } = useSesion()
  const usuario = sesion?.user.id
  const [resultado, setResultado] = useState<{
    clave: string
    orden: Orden | null
    mensajes: MensajeOrden[]
    contexto: ContextoAcciones | null
  } | null>(null)
  const [error, setError] = useState<{ clave: string; mensaje: string } | null>(null)
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
          const contexto = orden ? await leerContextoAcciones(orden, usuario!) : null
          if (!vigente || numero !== peticion) return
          setResultado({ clave, orden, mensajes, contexto })
          setError(null)
        }
      } catch (causa) {
        if (vigente && numero === peticion)
          setError({
            clave,
            mensaje: causa instanceof Error ? causa.message : 'No pudimos leer el pedido.',
          })
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
  const errorActual = error?.clave === clave ? error.mensaje : null
  return (
    <main className="pagina pagina-artesano pedidos">
      <Link className="pedido-volver" to="/pedidos">
        <Icono nombre="atras" />
        Mis pedidos
      </Link>
      <h1>Tu pedido</h1>
      {cargando ? (
        <Aviso>Cargando…</Aviso>
      ) : !sesion ? (
        <Aviso>Ingresa para ver este pedido.</Aviso>
      ) : errorActual && !actual?.orden ? (
        <Aviso tono="error">
          {errorActual}
          <Boton icono="adelante" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar
          </Boton>
        </Aviso>
      ) : !actual ? (
        <Aviso>Cargando…</Aviso>
      ) : !actual.orden ? (
        <Aviso>No encontramos este pedido o no pertenece a tu cuenta.</Aviso>
      ) : (
        <>
          {errorActual && (
            <Aviso tono="error">
              No pudimos actualizar el pedido. Se muestran los últimos datos disponibles.{' '}
              {errorActual}
              <Boton onClick={() => setIntento((valor) => valor + 1)}>Reintentar</Boton>
            </Aviso>
          )}
          <div className="pedido-acciones">
            <Boton
              variante="secundario"
              icono="adelante"
              onClick={() => setIntento((valor) => valor + 1)}
            >
              Actualizar
            </Boton>
          </div>
          {sinTiempoReal && (
            <Aviso tono="alerta">
              La actualización en vivo no está disponible. Toca Actualizar para ver novedades.
            </Aviso>
          )}
          <section className="pedido-acuerdo pedido-datos" aria-label="Datos del pedido">
            <h2 className="pedido-estado" data-estado={actual.orden.estado}>
              {etiquetaEstado(actual.orden.estado)}
            </h2>
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
              <dd>
                {actual.orden.fecha_entrega_estimada
                  ? mostrarFecha(actual.orden.fecha_entrega_estimada)
                  : 'Pendiente de confirmación'}
              </dd>
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
          {actual.contexto?.actor === 'artesano' && (
            <AccionesArtesano
              key={`${clave}:${actual.orden.estado}`}
              orden={actual.orden}
              contexto={actual.contexto}
              alCambiar={() => setIntento((valor) => valor + 1)}
            />
          )}
          {actual.contexto?.actor === 'comprador' && (
            <AccionesComprador
              key={`${clave}:${actual.orden.estado}`}
              orden={actual.orden}
              alCambiar={() => setIntento((valor) => valor + 1)}
            />
          )}
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
