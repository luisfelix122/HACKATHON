import { Esqueleto } from '../compartido/ui/Esqueleto'
import { liveQuery } from 'dexie'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { useSesionApk } from '../acceso/usePerfil'
import { escucharRed, hayConexion } from './audio'
import { db, listarBorradores, solicitarPersistenciaStorage, type BorradorLocal } from './db'
import {
  sincronizarBorrador,
  sincronizarTodosLosBorradores,
  listarProductosPersistidos,
  type ProductoPersistido,
} from './sincronizar'
import './borradores.css'

export function MisProductos() {
  const navigate = useNavigate()
  const { sesion } = useSesionApk()
  const artesanoId = sesion?.user?.id
  const [cuentaLeida, setCuentaLeida] = useState<string | undefined>(undefined)

  const [borradores, setBorradores] = useState<BorradorLocal[]>([])
  const [conectado, setConectado] = useState<boolean>(true)
  const [sincronizando, setSincronizando] = useState<boolean>(false)
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null)
  const [remotos, setRemotos] = useState<{
    cuenta: string
    productos: ProductoPersistido[]
  } | null>(null)
  const [errorRemotos, setErrorRemotos] = useState<string | null>(null)
  const [intentoRemotos, setIntentoRemotos] = useState(0)
  const [, startTransition] = useTransition()

  // Solicitar persistencia y cargar borradores
  const cargarLista = useCallback(async () => {
    const items = await listarBorradores(artesanoId)
    startTransition(() => {
      setBorradores(items)
    })
  }, [artesanoId])

  useEffect(() => {
    if (!artesanoId) return
    let vigente = true
    void listarProductosPersistidos(artesanoId, conectado)
      .then((productos) => {
        if (vigente) {
          setRemotos({ cuenta: artesanoId, productos })
          setErrorRemotos(null)
        }
      })
      .catch(async () => {
        let productos: ProductoPersistido[] = []
        try {
          productos = await listarProductosPersistidos(artesanoId, false)
        } catch {
          /* Sin copia local: se conserva el error recuperable. */
        }
        if (vigente) {
          setRemotos({ cuenta: artesanoId, productos })
          setErrorRemotos(
            'No pudimos actualizar tus productos. Se muestran los últimos datos guardados.',
          )
        }
      })
    return () => {
      vigente = false
    }
  }, [artesanoId, conectado, borradores.length, intentoRemotos])

  useEffect(() => {
    if (!artesanoId) return
    const escucha = liveQuery(() =>
      db.borrador_local.where('artesano_id').equals(artesanoId).toArray(),
    ).subscribe({
      next: (items) => {
        setBorradores(items)
        setCuentaLeida(artesanoId)
      },
      error: () => {
        setMensajeEstado('No pudimos leer tus borradores. Reintenta.')
        setCuentaLeida(artesanoId)
      },
    })
    return () => escucha.unsubscribe()
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

  const propios = borradores.filter((b) => b.artesano_id === artesanoId)
  const remotosVigentes = remotos && remotos.cuenta === artesanoId ? remotos.productos : []
  const productos = remotosVigentes.filter((p) => !propios.some((b) => b.id === p.id))
  const estadoRemoto = (id: string) => remotosVigentes.find((p) => p.id === id)?.estado
  const tienePendientes = propios.some(
    (b) => b.estado_sincronizacion === 'pendiente' || b.estado_sincronizacion === 'error',
  )

  return (
    <main className="pagina mis-productos">
      {!conectado && (
        <Aviso tono="sin-senal">Sin señal: lo que registres se guarda en tu celular.</Aviso>
      )}

      {mensajeEstado && <Aviso tono="info">{mensajeEstado}</Aviso>}
      {errorRemotos && (
        <Aviso tono="error">
          {errorRemotos}
          {conectado && (
            <Boton onClick={() => setIntentoRemotos((i) => i + 1)}>Reintentar productos</Boton>
          )}
        </Aviso>
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
            Nuevo
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

      {cuentaLeida !== artesanoId || (remotos?.cuenta !== artesanoId && propios.length === 0) ? (
        <Esqueleto variante="lista" etiqueta="Cargando tus productos…" />
      ) : propios.length === 0 && productos.length === 0 ? (
        <div className="panel vacio-contenedor">
          <p className="vacio">Aún no tienes productos. Toca Nuevo.</p>
          <div className="vacio-accion">
            <Boton variante="destacado" onClick={() => navigate('/nuevo')}>
              Nuevo
            </Boton>
          </div>
        </div>
      ) : (
        <div className="rejilla-productos">
          {propios.map((b) => (
            <TarjetaBorrador
              key={b.id}
              borrador={b}
              estadoRemoto={estadoRemoto(b.id)}
              conectado={conectado}
              sincronizando={sincronizando}
              alReintentar={() => reintentarBorrador(b)}
            />
          ))}
          {productos.map((p) => (
            <article className="tarjeta-producto panel" key={p.id}>
              <div className="tarjeta-info">
                <h3>{p.nombre}</h3>
                <p>{p.estado.replaceAll('_', ' ')}</p>
                {p.precio_final !== null && <p>S/ {p.precio_final.toFixed(2)}</p>}
                {conectado && (
                  <Link to={`/revisar/${p.id}`} className="enlace-editar">
                    {textoEnlaceRevisar(p.estado)}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}

/** Un producto publicado o retirado se edita (y elimina) desde la misma pantalla. */
function textoEnlaceRevisar(estado: string | undefined): string {
  return estado === 'publicado' || estado === 'retirado'
    ? 'Editar o eliminar'
    : 'Revisar y publicar'
}

function TarjetaBorrador({
  borrador,
  estadoRemoto,
  conectado,
  sincronizando,
  alReintentar,
}: {
  borrador: BorradorLocal
  estadoRemoto: string | undefined
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
          {borrador.estado_sincronizacion === 'sincronizado' ? (
            <Link to={`/revisar/${borrador.id}`} className="enlace-editar">
              {textoEnlaceRevisar(estadoRemoto)}
            </Link>
          ) : (
            !borrador.sincronizacion_iniciada && (
              <Link to={`/borrador/${borrador.id}`} className="enlace-editar">
                Editar borrador
              </Link>
            )
          )}

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
