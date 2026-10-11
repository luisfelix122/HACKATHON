import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Perfil } from '../compartido/dominio/perfil'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { useSesion } from '../compartido/sesion'
import { EstadoAcreditacion } from '../acceso/EstadoAcreditacion'
import { usePerfil } from '../acceso/usePerfil'
import { escucharRed, hayConexion } from './audio'
import { listarBorradores, solicitarPersistenciaStorage, type BorradorLocal } from './db'
import { sincronizarBorrador, sincronizarTodosLosBorradores } from './sincronizar'
import { listarOrdenes } from '../pedidos/consultas'
import { reproducirChimeNotificacion, suscribirNuevosPedidos } from '../pedidos/tiempoReal'
import { emitirNotificacionPush } from '../compartido/notificaciones/servicio'
import './borradores.css'

export function MisProductos({ perfil: perfilProp }: { perfil?: Perfil | null } = {}) {
  const navigate = useNavigate()
  const { sesion } = useSesion()
  const artesanoId = sesion?.user?.id
  const { perfil: perfilHook } = usePerfil(sesion)
  const perfil = perfilProp !== undefined ? perfilProp : perfilHook

  const [borradores, setBorradores] = useState<BorradorLocal[]>([])
  const [conectado, setConectado] = useState<boolean>(true)
  const [sincronizando, setSincronizando] = useState<boolean>(false)
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null)
  const [alertaPedido, setAlertaPedido] = useState<{ id: string } | null>(null)
  const [conteoPedidosSolicitados, setConteoPedidosSolicitados] = useState<number>(0)
  const [, startTransition] = useTransition()

  // Solicitar persistencia y cargar borradores
  const cargarLista = useCallback(async () => {
    const items = await listarBorradores(artesanoId)
    startTransition(() => {
      setBorradores(items)
    })
  }, [artesanoId])

  const ejecutarSincronizacionLote = useCallback(async () => {
    if (!artesanoId || sincronizando) return
    setSincronizando(true)
    setMensajeEstado(null)
    try {
      const resultados = await sincronizarTodosLosBorradores(artesanoId)
      await cargarLista()
      if (resultados.length === 0) {
        setMensajeEstado('No hay borradores pendientes por sincronizar.')
      } else if (resultados.some((r) => !r.exito)) {
        const fallidos = resultados.filter((r) => !r.exito).length
        setMensajeEstado(
          `No se pudieron sincronizar ${fallidos} borrador(es). Se reintentará con señal.`,
        )
      } else {
        setMensajeEstado('Borradores sincronizados con éxito.')
      }
    } catch {
      setMensajeEstado('Ocurrió un problema al sincronizar. Se reintentará cuando haya señal.')
    } finally {
      setSincronizando(false)
    }
  }, [artesanoId, sincronizando, cargarLista])

  useEffect(() => {
    solicitarPersistenciaStorage()
    cargarLista()

    hayConexion().then(setConectado)

    const desuscribirRed = escucharRed(async (estaConectado) => {
      setConectado(estaConectado)
      if (estaConectado && artesanoId) {
        // Disparo automático de sincronización al recuperar señal
        ejecutarSincronizacionLote()
      }
    })

    return () => desuscribirRed()
  }, [artesanoId, cargarLista, ejecutarSincronizacionLote])

  const reintentarBorrador = async (borrador: BorradorLocal) => {
    if (sincronizando) return
    setSincronizando(true)
    setMensajeEstado(null)
    try {
      const res = await sincronizarBorrador(borrador)
      await cargarLista()
      if (res.exito) {
        setMensajeEstado(`"${borrador.nombre}" sincronizado con éxito.`)
      } else {
        setMensajeEstado(`Error al sincronizar "${borrador.nombre}": ${res.error}`)
      }
    } finally {
      setSincronizando(false)
    }
  }

  // Escuchar órdenes entrantes en tiempo real y consultar solicitudes pendientes
  useEffect(() => {
    if (!artesanoId) return
    let vigente = true
    listarOrdenes()
      .then((ordenes) => {
        if (vigente) {
          const solicitados = ordenes.filter((o) => o.estado === 'solicitada').length
          setConteoPedidosSolicitados(solicitados)
        }
      })
      .catch(() => {})

    const cancelar = suscribirNuevosPedidos((nuevaOrden) => {
      reproducirChimeNotificacion()
      void emitirNotificacionPush({
        titulo: 'Nuevo pedido recibido',
        cuerpo: 'Un cliente acaba de solicitar una de tus artesanías. Toca para ver los detalles.',
        tipo: 'pedido',
        ordenId: nuevaOrden?.id,
      })
      setAlertaPedido({ id: nuevaOrden.id })
      setConteoPedidosSolicitados((c) => c + 1)
    })

    return () => {
      vigente = false
      cancelar()
    }
  }, [artesanoId])

  const tienePendientes = borradores.some(
    (b) => b.estado_sincronizacion === 'pendiente' || b.estado_sincronizacion === 'error',
  )

  return (
    <main className="pagina mis-productos">
      {perfil && <EstadoAcreditacion perfil={perfil} />}

      {!conectado && (
        <Aviso tono="sin-senal">Sin señal: lo que registres se guarda en tu celular.</Aviso>
      )}

      {mensajeEstado && <Aviso tono="info">{mensajeEstado}</Aviso>}

      {alertaPedido && (
        <div className="aviso-pedido-nuevo-flotante" role="alert">
          <div
            style={{
              width: 36,
              height: 36,
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
          <div className="aviso-texto">
            <strong>¡Nuevo pedido recibido!</strong>
            <p>
              Un cliente acaba de solicitar una de tus artesanías. Toca para ver los detalles y
              coordinar la entrega.
            </p>
          </div>
          <div className="aviso-acciones-flotante">
            <Link to={`/pedidos/${alertaPedido.id}`} className="boton boton-destacado">
              Ver pedido
            </Link>
            <button
              type="button"
              className="boton-cerrar-alerta"
              aria-label="Cerrar aviso"
              onClick={() => setAlertaPedido(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {conteoPedidosSolicitados > 0 && !alertaPedido && (
        <div className="aviso-pedidos-pendientes-banner panel">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radio, 10px)',
              backgroundColor: 'var(--arena-clara)',
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
          <div className="aviso-info">
            <strong>
              Tienes {conteoPedidosSolicitados}{' '}
              {conteoPedidosSolicitados === 1 ? 'pedido' : 'pedidos'} por atender.
            </strong>
            <p className="texto-ayuda">
              Revisa los detalles solicitados por los compradores y coordina la entrega en el chat.
            </p>
          </div>
          <Link to="/pedidos" className="boton boton-secundario enlace-ver-pedidos">
            Ver pedidos ({conteoPedidosSolicitados})
          </Link>
        </div>
      )}

      <header className="cabecera-mis-productos">
        <div>
          <h1>Mis productos</h1>
          <p className="texto-ayuda">
            Gestiona tus artesanías creadas y su estado de sincronización con la nube.
          </p>
        </div>

        <div className="acciones-cabecera">
          <Boton variante="destacado" onClick={() => navigate('/nuevo')}>
            + Nueva pieza
          </Boton>

          {conectado && tienePendientes && (
            <Boton
              variante="secundario"
              cargando={sincronizando}
              onClick={ejecutarSincronizacionLote}
            >
              Sincronizar
            </Boton>
          )}
        </div>
      </header>

      {borradores.length === 0 ? (
        <div className="panel vacio-contenedor">
          <p className="vacio">Aún no tienes piezas registradas.</p>
          <p
            className="texto-ayuda"
            style={{
              textAlign: 'center',
              marginBottom: 'var(--e4)',
              maxWidth: '28rem',
              marginInline: 'auto',
            }}
          >
            Para publicar una artesanía en la vitrina, primero crea un borrador con tu foto y
            precio. Luego podrás prepararla con la IA y publicarla.
          </p>
          <div className="vacio-accion">
            <Boton variante="destacado" onClick={() => navigate('/nuevo')}>
              + Crear nueva pieza
            </Boton>
          </div>
        </div>
      ) : (
        <div className="rejilla-productos">
          {borradores.map((b) => (
            <TarjetaBorrador
              key={b.id}
              borrador={b}
              conectado={conectado}
              sincronizando={sincronizando}
              alReintentar={() => reintentarBorrador(b)}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function TarjetaBorrador({
  borrador,
  conectado,
  sincronizando,
  alReintentar,
}: {
  borrador: BorradorLocal
  conectado: boolean
  sincronizando: boolean
  alReintentar: () => void
}) {
  const miniaturaUrl = useMemo(() => {
    if (!borrador.foto_blob) return null
    return URL.createObjectURL(borrador.foto_blob)
  }, [borrador.foto_blob])

  useEffect(() => {
    return () => {
      if (miniaturaUrl) {
        URL.revokeObjectURL(miniaturaUrl)
      }
    }
  }, [miniaturaUrl])

  const renderBadgeEstado = () => {
    switch (borrador.estado_sincronizacion) {
      case 'sincronizado':
        return <span className="badge-estado estado-sincronizado">Sincronizado</span>
      case 'sincronizando':
        return <span className="badge-estado estado-sincronizando">Sincronizando…</span>
      case 'error':
        return <span className="badge-estado estado-error">Error al sincronizar</span>
      case 'pendiente':
      default:
        return <span className="badge-estado estado-guardado">Guardado en el celular</span>
    }
  }

  return (
    <article className="tarjeta-producto panel">
      <div className="tarjeta-media">
        {miniaturaUrl ? (
          <img src={miniaturaUrl} alt={borrador.nombre} className="tarjeta-img" />
        ) : (
          <div className="tarjeta-sin-foto">Sin foto</div>
        )}
      </div>

      <div className="tarjeta-info">
        <div className="tarjeta-estado">{renderBadgeEstado()}</div>
        <h3 className="tarjeta-titulo">{borrador.nombre}</h3>
        <p className="tarjeta-precio">S/ {borrador.precio_final.toFixed(2)}</p>
        <p className="tarjeta-disp">
          {borrador.disponibilidad === 'en_stock'
            ? 'Pieza lista (en stock)'
            : `A pedido (${borrador.plazo_dias || 0} días)`}
        </p>

        {borrador.estado_sincronizacion === 'error' && borrador.error_sincronizacion && (
          <p className="tarjeta-error-texto">{borrador.error_sincronizacion}</p>
        )}

        <div className="tarjeta-acciones">
          <Link to={`/borrador/${borrador.id}`} className="enlace-editar">
            Editar borrador
          </Link>

          <Link to={`/revisar/${borrador.id}`} className="enlace-publicar">
            Preparar y Publicar →
          </Link>

          {borrador.estado_sincronizacion === 'error' && conectado && (
            <Boton variante="secundario" cargando={sincronizando} onClick={alReintentar}>
              Reintentar
            </Boton>
          )}
        </div>
      </div>
    </article>
  )
}
