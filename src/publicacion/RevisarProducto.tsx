import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerSupabase } from '../compartido/supabase'
import { usePerfil } from '../acceso/usePerfil'
import { useSesion } from '../compartido/sesion'
import {
  TIPOS_PRODUCTO,
  type Ficha,
  type FotoProducto,
  type Producto,
  type Disponibilidad,
  type TipoProducto,
} from '../compartido/dominio/producto'
import { procesarProductoConIa, suscribirReintentoOnline } from './procesar'
import { ElegirFotos, type ItemFotoUI } from './ElegirFotos'
import { validarPublicacion, ejecutarPublicacion } from './publicar'
import { normalizarEtiquetas } from '../../supabase/functions/procesar-producto/ficha'
import './publicacion.css'

export const RevisarProducto: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Estados del producto y sesión
  const { sesion } = useSesion()
  const { perfil } = usePerfil(sesion)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [enLinea, setEnLinea] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  // Estados de edición del formulario
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [materialesTexto, setMaterialesTexto] = useState('')
  const [tecnica, setTecnica] = useState('')
  const [tipoProducto, setTipoProducto] = useState<TipoProducto>('textil')
  const [historiaPieza, setHistoriaPieza] = useState('')
  const [etiquetasTexto, setEtiquetasTexto] = useState('')
  const [precioFinal, setPrecioFinal] = useState<number | ''>('')
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>('en_stock')
  const [plazoDias, setPlazoDias] = useState<number | ''>('')
  const [comentarioPrecio, setComentarioPrecio] = useState<string | null>(null)
  const [fotosUI, setFotosUI] = useState<ItemFotoUI[]>([])

  // Estados de acciones
  const [procesandoIa, setProcesandoIa] = useState(false)
  const [errorIa, setErrorIa] = useState<{ error: string; mensaje: string } | null>(null)
  const [advertenciasIa, setAdvertenciasIa] = useState<string[]>([])
  const [guardandoPublicacion, setGuardandoPublicacion] = useState(false)
  const [erroresPublicacion, setErroresPublicacion] = useState<string[]>([])
  const [publicadoExito, setPublicadoExito] = useState(false)

  // Escuchar conectividad
  useEffect(() => {
    const alConectar = () => setEnLinea(true)
    const alDesconectar = () => setEnLinea(false)
    window.addEventListener('online', alConectar)
    window.addEventListener('offline', alDesconectar)
    return () => {
      window.removeEventListener('online', alConectar)
      window.removeEventListener('offline', alDesconectar)
    }
  }, [])

  // Cargar producto y fotos desde Supabase
  const cargarDatos = useCallback(async () => {
    if (!id) return
    const supabase = obtenerSupabase()

    try {
      const { data: prodData, error: errProd } = await supabase
        .from('producto')
        .select('*')
        .eq('id', id)
        .single()

      if (errProd || !prodData) {
        setErrorCarga('No se encontró el producto o no tienes acceso.')
        setCargando(false)
        return
      }

      setProducto(prodData as Producto)

      // Prellenar campos
      if (prodData.ficha) {
        const f = prodData.ficha as Ficha
        setTitulo(f.titulo || '')
        setDescripcion(f.descripcion || '')
        setMaterialesTexto(Array.isArray(f.materiales) ? f.materiales.join(', ') : '')
        setTecnica(f.tecnica || '')
        setTipoProducto(f.tipo_producto || 'textil')
        setHistoriaPieza(f.historia_pieza || '')
        setEtiquetasTexto(Array.isArray(f.etiquetas) ? f.etiquetas.join(', ') : '')
      } else {
        setTitulo(prodData.nombre || '')
        setDescripcion(prodData.descripcion_texto || '')
      }

      if (prodData.precio_final !== null && prodData.precio_final !== undefined) {
        setPrecioFinal(prodData.precio_final)
      }
      if (prodData.disponibilidad) {
        setDisponibilidad(prodData.disponibilidad)
      }
      if (prodData.plazo_dias !== null && prodData.plazo_dias !== undefined) {
        setPlazoDias(prodData.plazo_dias)
      }
      if (prodData.comentario_precio_ia) {
        setComentarioPrecio(prodData.comentario_precio_ia)
      }

      // Si tiene error registrado de rechazo
      if (prodData.revision_ia === 'rechazada' && prodData.ia_error) {
        setErrorIa({
          error: 'no_es_artesania',
          mensaje: prodData.ia_error,
        })
      }

      // Cargar fotos
      const { data: fotosData, error: errFotos } = await supabase
        .from('foto_producto')
        .select('*')
        .eq('producto_id', id)
        .order('posicion', { ascending: true })

      if (!errFotos && fotosData) {
        const items: ItemFotoUI[] = (fotosData as FotoProducto[]).map((f) => {
          const publicUrl = supabase.storage.from('fotos').getPublicUrl(f.ruta).data.publicUrl
          return {
            id: f.id,
            origen: f.origen,
            variante: f.variante,
            ruta: f.ruta,
            urlVisual: publicUrl,
            publicada: f.publicada,
            posicion: f.posicion,
          }
        })
        setFotosUI(items)
      }
    } catch (err) {
      setErrorCarga(err instanceof Error ? err.message : 'Error al cargar producto')
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      await Promise.resolve()
      if (!cancelado) {
        await cargarDatos()
      }
    }
    void cargar()
    return () => {
      cancelado = true
    }
  }, [cargarDatos])

  // Preparar con IA
  const ejecutarPrepararConIa = useCallback(async () => {
    if (!id || !enLinea) return
    setProcesandoIa(true)
    setErrorIa(null)
    setAdvertenciasIa([])

    const res = await procesarProductoConIa(id, true)
    setProcesandoIa(false)

    if (res.ok) {
      const { ficha, comentario_precio, advertencias } = res.datos
      setTitulo(ficha.titulo)
      setDescripcion(ficha.descripcion)
      setMaterialesTexto(ficha.materiales.join(', '))
      setTecnica(ficha.tecnica)
      setTipoProducto(ficha.tipo_producto)
      setHistoriaPieza(ficha.historia_pieza || '')
      setEtiquetasTexto(ficha.etiquetas.join(', '))
      setComentarioPrecio(comentario_precio)
      setAdvertenciasIa(advertencias)

      // Actualizar producto en estado local
      setProducto((prev) =>
        prev
          ? {
              ...prev,
              estado: 'en_revision',
              revision_ia: 'aprobada',
              comentario_precio_ia: comentario_precio,
              ia_error: null,
            }
          : null,
      )

      // Recargar fotos desde Supabase para traer las variantes generadas
      await cargarDatos()
    } else {
      setErrorIa(res.error)
      if (res.error.error === 'no_es_artesania' || res.error.error === 'contenido_no_permitido') {
        setProducto((prev) =>
          prev
            ? {
                ...prev,
                revision_ia: 'rechazada',
                ia_error: res.error.mensaje,
              }
            : null,
        )
      }
    }
  }, [id, enLinea, cargarDatos])

  // Suscribir reintento automático si falló por conexión
  useEffect(() => {
    if (errorIa?.error === 'ia_no_disponible' && !enLinea) {
      return suscribirReintentoOnline(() => {
        ejecutarPrepararConIa()
      })
    }
  }, [errorIa, enLinea, ejecutarPrepararConIa])

  // Helper para armar objeto Ficha
  const armarFichaActual = (): Ficha => {
    const matArray = materialesTexto
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)

    const rawEtiquetas = etiquetasTexto
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    return {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      materiales: matArray,
      tecnica: tecnica.trim(),
      tipo_producto: tipoProducto,
      historia_pieza: historiaPieza.trim(),
      etiquetas: normalizarEtiquetas(rawEtiquetas),
    }
  }

  // Publicar producto
  const manejarPublicar = async () => {
    if (!id) return
    setErroresPublicacion([])

    const fichaActual = armarFichaActual()
    const precioNumerico = typeof precioFinal === 'number' ? precioFinal : null
    const plazoNumerico = typeof plazoDias === 'number' ? plazoDias : null

    const validacion = validarPublicacion({
      ficha: fichaActual,
      precioFinal: precioNumerico,
      disponibilidad,
      plazoDias: plazoNumerico,
      revisionIa: producto?.revision_ia || 'sin_revisar',
      acreditacion: perfil?.acreditacion,
      fotos: fotosUI.map((f) => ({
        id: f.id,
        producto_id: id,
        origen: f.origen,
        variante: f.variante,
        ruta: f.ruta,
        publicada: f.publicada,
        posicion: f.posicion,
        creado_en: new Date().toISOString(),
      })),
    })

    if (!validacion.valido) {
      setErroresPublicacion(validacion.errores)
      return
    }

    setGuardandoPublicacion(true)
    const supabase = obtenerSupabase()

    const res = await ejecutarPublicacion(supabase, {
      productoId: id,
      ficha: fichaActual,
      precioFinal: precioNumerico!,
      disponibilidad,
      plazoDias: plazoNumerico,
      fotos: fotosUI.map((f) => ({
        id: f.id,
        publicada: f.publicada,
        posicion: f.posicion,
      })),
    })

    setGuardandoPublicacion(false)

    if (res.ok) {
      setPublicadoExito(true)
      setTimeout(() => {
        navigate('/')
      }, 1500)
    } else {
      setErroresPublicacion([res.error || 'Error al publicar el producto'])
    }
  }

  if (cargando) {
    return (
      <main className="revisar-producto-pagina" role="main">
        <p className="indicador-cargando">Cargando…</p>
      </main>
    )
  }

  if (errorCarga || !producto) {
    return (
      <main className="revisar-producto-pagina" role="main">
        <div className="tarjeta-alerta-error" role="alert">
          <p>{errorCarga || 'Producto no encontrado.'}</p>
          <button
            type="button"
            onClick={() => {
              setCargando(true)
              void cargarDatos()
            }}
            className="boton-ia-primario"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  const esRechazado =
    producto.revision_ia === 'rechazada' ||
    errorIa?.error === 'no_es_artesania' ||
    errorIa?.error === 'contenido_no_permitido'
  const fotosPublicadas = fotosUI.filter((f) => f.publicada)
  const puedePublicar =
    !esRechazado &&
    perfil?.acreditacion === 'aprobada' &&
    enLinea &&
    !procesandoIa &&
    !guardandoPublicacion &&
    fotosPublicadas.length > 0

  return (
    <main className="revisar-producto-pagina" role="main">
      {!enLinea && (
        <div className="franja-sin-conexion" role="alert">
          Sin señal: lo guardamos en tu celular
        </div>
      )}

      <header className="revisar-cabecera">
        <button type="button" onClick={() => navigate('/')} className="boton-volver-atras">
          Volver a Mis productos
        </button>
        <h1 className="revisar-titulo">Revisar y publicar</h1>
        <p className="revisar-bajada">
          Optimiza la ficha comercial y las fotos con IA antes de poner tu pieza en la vitrina.
        </p>
      </header>

      {/* Panel de Asistencia IA */}
      <section className="tarjeta-ia-panel" aria-label="Asistente de IA">
        <div className="tarjeta-ia-cabecera">
          <div>
            <h2 className="tarjeta-ia-titulo">Preparación inteligente con IA</h2>
            <p className="descripcion-elegir-fotos">
              Analiza la foto original, evalúa autenticidad artesanal, redacta la ficha y sugiere
              variantes de imagen.
            </p>
          </div>
          <button
            type="button"
            onClick={ejecutarPrepararConIa}
            disabled={procesandoIa || !enLinea}
            className="boton-ia-primario"
            aria-busy={procesandoIa}
          >
            {procesandoIa ? 'Preparando con IA…' : 'Preparar con IA'}
          </button>
        </div>

        {advertenciasIa.length > 0 && (
          <div className="aviso-fotos-incompletas">
            {advertenciasIa.map((adv, i) => (
              <p key={i} style={{ margin: 0 }}>
                ⚠️ {adv}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Alerta de rechazo por IA (422) */}
      {esRechazado && (
        <section className="tarjeta-alerta-rechazo" role="alert">
          <h3 className="titulo-rechazo">Pieza no aprobada por la IA</h3>
          <p className="motivo-rechazo">
            {errorIa?.mensaje ||
              producto.ia_error ||
              'Esta pieza parece industrial. Si la hiciste tú, toma otra foto que muestre el trabajo a mano.'}
          </p>
          <p>La pieza anterior se conserva. La nueva foto se guardará en otro borrador.</p>
          <div className="acciones-rechazo">
            <button
              type="button"
              onClick={() => navigate('/nuevo')}
              className="boton-orden"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              Crear borrador con otra foto
            </button>
            <button
              type="button"
              onClick={ejecutarPrepararConIa}
              disabled={procesandoIa || !enLinea}
              className="boton-ia-primario"
            >
              Reintentar
            </button>
          </div>
        </section>
      )}

      {/* Alerta de error 502 / servicio IA */}
      {errorIa && !esRechazado && (
        <section className="tarjeta-alerta-error" role="alert">
          <p style={{ margin: '0 0 1rem 0' }}>{errorIa.mensaje}</p>
          <div className="acciones-rechazo">
            <button
              type="button"
              onClick={ejecutarPrepararConIa}
              disabled={procesandoIa || !enLinea}
              className="boton-ia-primario"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => setErrorIa(null)}
              className="boton-orden"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              Completar a mano
            </button>
          </div>
        </section>
      )}

      {/* Selección y orden de fotos */}
      <ElegirFotos
        fotos={fotosUI}
        alCambiarFotos={setFotosUI}
        deshabilitado={procesandoIa || guardandoPublicacion}
      />

      {/* Formulario de Ficha Técnica */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          manejarPublicar()
        }}
        className="formulario-revisar"
      >
        <div className="grupo-campo">
          <label htmlFor="campo-titulo">Título comercial para turistas *</label>
          <input
            id="campo-titulo"
            type="text"
            value={titulo}
            maxLength={80}
            onChange={(e) => setTitulo(e.target.value)}
            className="control-texto"
            placeholder="Ej. Poncho-toalla de algodón para surfistas"
            required
          />
          <span className="ayuda-campo">{titulo.length} / 80 caracteres</span>
        </div>

        <div className="grupo-campo">
          <label htmlFor="campo-descripcion">Descripción de la pieza *</label>
          <textarea
            id="campo-descripcion"
            value={descripcion}
            maxLength={1200}
            onChange={(e) => setDescripcion(e.target.value)}
            className="control-textarea"
            placeholder="Describe la pieza, su inspiración y origen..."
            rows={4}
            required
          />
          <span className="ayuda-campo">{descripcion.length} / 1200 caracteres</span>
        </div>

        <div className="fila-dos-columnas">
          <div className="grupo-campo">
            <label htmlFor="campo-tipo">Tipo de producto *</label>
            <select
              id="campo-tipo"
              value={tipoProducto}
              onChange={(e) => setTipoProducto(e.target.value as TipoProducto)}
              className="control-select"
              required
            >
              {TIPOS_PRODUCTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo-campo">
            <label htmlFor="campo-tecnica">Técnica artesanal *</label>
            <input
              id="campo-tecnica"
              type="text"
              value={tecnica}
              maxLength={120}
              onChange={(e) => setTecnica(e.target.value)}
              className="control-texto"
              placeholder="Ej. Tejido a crochet, tallado en madera"
              required
            />
          </div>
        </div>

        <div className="grupo-campo">
          <label htmlFor="campo-materiales">Materiales utilizados (separados por coma) *</label>
          <input
            id="campo-materiales"
            type="text"
            value={materialesTexto}
            onChange={(e) => setMaterialesTexto(e.target.value)}
            className="control-texto"
            placeholder="Ej. algodón, tintes naturales, hilo pima"
            required
          />
        </div>

        <div className="grupo-campo">
          <label htmlFor="campo-historia">Historia o valor cultural de la pieza</label>
          <textarea
            id="campo-historia"
            value={historiaPieza}
            maxLength={600}
            onChange={(e) => setHistoriaPieza(e.target.value)}
            className="control-textarea"
            placeholder="Cuéntale al turista la tradición detrás de esta creación..."
            rows={3}
          />
          <span className="ayuda-campo">{historiaPieza.length} / 600 caracteres</span>
        </div>

        <div className="grupo-campo">
          <label htmlFor="campo-etiquetas">
            Etiquetas para búsqueda (máximo 8, separadas por coma)
          </label>
          <input
            id="campo-etiquetas"
            type="text"
            value={etiquetasTexto}
            onChange={(e) => setEtiquetasTexto(e.target.value)}
            className="control-texto"
            placeholder="Ej. surf, algodon, lobitos, toalla"
          />
        </div>

        {/* Sección de Precio y Referencia IA */}
        <div className="fila-dos-columnas">
          <div className="grupo-campo">
            <label htmlFor="campo-precio">Precio final de venta (S/ PEN) *</label>
            <input
              id="campo-precio"
              type="number"
              step="0.01"
              min="0.01"
              value={precioFinal}
              onChange={(e) => setPrecioFinal(e.target.value === '' ? '' : Number(e.target.value))}
              className="control-texto"
              placeholder="0.00"
              required
            />

            {comentarioPrecio && (
              <div
                className="tarjeta-comentario-precio"
                role="region"
                aria-label="Referencia de la IA"
              >
                <span className="etiqueta-referencia-ia">Referencia de la IA:</span>
                <p style={{ margin: 0 }}>{comentarioPrecio}</p>
              </div>
            )}
          </div>

          <div className="grupo-campo">
            <label>Disponibilidad *</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="disponibilidad"
                  value="en_stock"
                  checked={disponibilidad === 'en_stock'}
                  onChange={() => setDisponibilidad('en_stock')}
                />
                En stock
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="disponibilidad"
                  value="a_pedido"
                  checked={disponibilidad === 'a_pedido'}
                  onChange={() => setDisponibilidad('a_pedido')}
                />
                A pedido
              </label>
            </div>

            {disponibilidad === 'a_pedido' && (
              <div style={{ marginTop: '0.5rem' }}>
                <label htmlFor="campo-plazo">Plazo de fabricación (días) *</label>
                <input
                  id="campo-plazo"
                  type="number"
                  min="1"
                  value={plazoDias}
                  onChange={(e) =>
                    setPlazoDias(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="control-texto"
                  placeholder="Ej. 7"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Panel de publicación */}
        <section className="panel-publicacion-accion">
          {perfil?.acreditacion !== 'aprobada' && (
            <p style={{ color: 'var(--error)', margin: '0 0 1rem 0' }}>
              🔒 Tu acreditación como artesano está{' '}
              <strong>{perfil?.acreditacion || 'pendiente'}</strong>. Solo los artesanos aprobados
              por el administrador pueden publicar productos en la vitrina.
            </p>
          )}

          {erroresPublicacion.length > 0 && (
            <ul className="lista-errores-publicar" role="alert">
              {erroresPublicacion.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {publicadoExito && (
            <div className="mensaje-exito" role="status">
              ¡Producto publicado con éxito en la vitrina! Redirigiendo…
            </div>
          )}

          <button
            type="submit"
            disabled={!puedePublicar}
            className="boton-publicar"
            aria-busy={guardandoPublicacion}
          >
            {guardandoPublicacion ? 'Publicando…' : 'Publicar producto'}
          </button>
        </section>
      </form>
    </main>
  )
}
export default RevisarProducto
