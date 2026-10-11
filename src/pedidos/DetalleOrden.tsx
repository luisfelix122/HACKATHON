import { Esqueleto } from '../compartido/ui/Esqueleto'
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
import { accionesVisibles, etiquetaEstado } from './estadoOrden'
import { mostrarFecha } from './estimarEntrega'
import { iniciales } from './bandeja'
import './pedidos.css'

export function DetalleOrden() {
  const { id } = useParams()
  const [vista, setVista] = useState<'datos' | 'chat'>('chat')
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
  const nombre =
    actual?.orden?.nombre_producto ||
    actual?.contexto?.producto?.nombre ||
    'Pedido #' + (id?.slice(0, 8) ?? '')
  const actor = actual?.contexto?.actor
  const etiquetas: Record<string, string> = {
    aceptar_orden: 'Proponer total',
    confirmar_total: 'Confirmar total',
    enviar_enlace_pago: 'Enviar enlace de pago',
    verificar_abono: 'Verificar abono',
    marcar_enviada: 'Marcar enviada',
    marcar_lista_recojo: 'Lista para recojo',
    marcar_entregada: 'Marcar entregada',
  }
  const rapidas =
    actual?.orden && actor
      ? accionesVisibles(actor, actual.orden.estado, actual.orden.modalidad).filter(
          (a) => etiquetas[a],
        )
      : []
  const errorActual = error?.clave === clave ? error.mensaje : null
  return (
    <main className="pagina pedidos pedido-detalle">
      <Link className="pedido-volver" to="/pedidos">
        <Icono nombre="atras" />
        Mis pedidos
      </Link>
      <header className="pedido-detalle-cabecera">
        <div>
          <h1 className="pedido-detalle-titulo">Tu pedido</h1>
          {actual?.orden && (
            <p className="texto-secundario">
              {nombre} · {actual.orden.nombre_contraparte || 'Nombre no disponible'}
            </p>
          )}
        </div>
        {actual?.orden && (
          <Boton
            variante="secundario"
            icono="adelante"
            onClick={() => setIntento((valor) => valor + 1)}
          >
            Actualizar
          </Boton>
        )}
      </header>
      {cargando ? (
        <Esqueleto variante="detalle" etiqueta="Cargando…" />
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
        <Esqueleto variante="detalle" etiqueta="Cargando…" />
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
          {sinTiempoReal && (
            <Aviso tono="alerta">
              La actualización en vivo no está disponible. Toca Actualizar para ver novedades.
            </Aviso>
          )}
          <div className="pedido-vistas" role="group" aria-label="Vista del pedido">
            <button
              type="button"
              aria-pressed={vista === 'datos'}
              aria-controls="panel-datos-pedido"
              onClick={() => setVista('datos')}
            >
              Ver datos
            </button>
            <button
              type="button"
              aria-pressed={vista === 'chat'}
              aria-controls="panel-chat-pedido"
              onClick={() => setVista('chat')}
            >
              Ver chat
            </button>
          </div>
          <div className="pedido-layout">
            <aside
              id="panel-datos-pedido"
              className="pedido-lateral"
              data-activo={vista === 'datos'}
            >
              <section className="pedido-acuerdo pedido-datos" aria-label="Datos del pedido">
                <h2 className="pedido-tarjeta-titulo">Datos del pedido</h2>
                <p className="pedido-producto-nombre">{nombre}</p>
                <p className="texto-secundario">
                  {actual.orden.nombre_contraparte || 'Nombre no disponible'}
                </p>
                <span className="pedido-estado" data-estado={actual.orden.estado}>
                  {etiquetaEstado(actual.orden.estado)}
                </span>
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
                      : new Intl.NumberFormat('es-PE', {
                          style: 'currency',
                          currency: 'PEN',
                        }).format(actual.orden.total)}
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
                      <dt>DNI del destinatario</dt>
                      <dd>{actual.orden.datos_envio.dni ?? 'No registrado en este pedido'}</dd>
                      <dt>Teléfono</dt>
                      <dd>{actual.orden.datos_envio.telefono}</dd>
                      <dt>Destino</dt>
                      <dd>
                        {actual.orden.datos_envio.departamento},{' '}
                        {actual.orden.datos_envio.provincia}, {actual.orden.datos_envio.distrito}
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
              {!actor && (
                <Aviso tono="alerta">
                  No pudimos identificar tu participación en este pedido. Toca Actualizar; si
                  continúa, pide al administrador revisar tu cuenta.
                </Aviso>
              )}
            </aside>
            <section
              id="panel-chat-pedido"
              className="pedido-chat"
              data-activo={vista === 'chat'}
              aria-label="Conversación del pedido"
            >
              <header className="pedido-chat-cabecera">
                <span className="pedido-avatar" aria-hidden="true">
                  {iniciales(nombre)}
                </span>
                <div>
                  <h2>{nombre}</h2>
                  <p className="texto-secundario">
                    {actual.orden.nombre_contraparte || 'Nombre no disponible'}
                  </p>
                  <p className="texto-secundario">
                    Hora local:{' '}
                    {new Date().toLocaleTimeString('es-PE', {
                      timeZone: 'America/Lima',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    · Lima
                  </p>
                </div>
              </header>
              <HiloMensajes
                acciones={
                  rapidas.length > 0 && (
                    <nav className="pedido-rapidas" aria-label="Acciones rápidas del pedido">
                      {rapidas.map((accion) => (
                        <a key={accion} href="#pedido-acciones" onClick={() => setVista('datos')}>
                          {etiquetas[accion]}
                        </a>
                      ))}
                    </nav>
                  )
                }
                key={clave}
                ordenId={actual.orden.id}
                usuarioId={sesion.user.id}
                mensajes={actual.mensajes}
                alEnviar={() => setIntento((valor) => valor + 1)}
              />
            </section>
          </div>
        </>
      )}
    </main>
  )
}
