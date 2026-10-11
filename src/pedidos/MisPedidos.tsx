import { Esqueleto } from '../compartido/ui/Esqueleto'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Modalidad } from '../compartido/dominio/orden'
import { useSesion } from '../compartido/sesion'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { listarOrdenesConProducto, type OrdenConProducto } from './consultas'
import { filtrarPedidos, iniciales, nombrePedido } from './bandeja'
import { contarEnCurso, etiquetaEstado } from './estadoOrden'
import './pedidos.css'

export function MisPedidos() {
  const { sesion, cargando } = useSesion()
  const ubicacion = useLocation()
  const [buscar, setBuscar] = useState('')
  const [modalidad, setModalidad] = useState<Modalidad | 'todos'>('todos')
  const [mostrarAviso, setMostrarAviso] = useState(true)
  const [resultado, setResultado] = useState<{
    usuario: string
    ordenes: OrdenConProducto[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const id = sesion?.user.id
  useEffect(() => {
    if (!id) return
    let vigente = true
    listarOrdenesConProducto()
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
  const ordenes = resultado && resultado.usuario === id ? resultado.ordenes : []
  const visibles = filtrarPedidos(ordenes, buscar, modalidad)
  return (
    <main className="pagina pagina-artesano pedidos">
      <header className="bandeja-cabecera">
        <h1>Mis pedidos</h1>
        <p className="texto-secundario">Conversa y coordina cada pieza en su pedido.</p>
      </header>
      {cargando ? (
        <Esqueleto variante="lista" etiqueta="Cargando…" />
      ) : !sesion ? (
        <Aviso>
          Ingresa para ver tus pedidos.{' '}
          {import.meta.env.MODE === 'web' && (
            <Link to={`/ingresar?volver=${encodeURIComponent(ubicacion.pathname)}`}>Ingresar</Link>
          )}
        </Aviso>
      ) : error ? (
        <Aviso tono="error">
          {error}{' '}
          <Boton icono="adelante" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar
          </Boton>
        </Aviso>
      ) : !resultado || resultado.usuario !== id ? (
        <Esqueleto variante="lista" etiqueta="Cargando…" />
      ) : (
        <>
          {import.meta.env.MODE === 'artesano' && (
            <Aviso>
              {resultado.ordenes.length} pedidos · {contarEnCurso(resultado.ordenes)} en curso.
            </Aviso>
          )}
          <Boton
            variante="secundario"
            icono="adelante"
            onClick={() => setIntento((valor) => valor + 1)}
          >
            Actualizar
          </Boton>
          <div className="bandeja-herramientas">
            <label className="solo-lectores" htmlFor="buscar-pedidos">
              Buscar pedidos
            </label>
            <input
              id="buscar-pedidos"
              type="search"
              className="bandeja-buscador"
              placeholder="Buscar pedidos"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
            />
            <div
              className="bandeja-filtros"
              role="group"
              aria-label="Filtrar pedidos por modalidad"
            >
              {(['todos', 'envio', 'recojo'] as const).map((filtro) => (
                <button
                  type="button"
                  key={filtro}
                  aria-pressed={modalidad === filtro}
                  onClick={() => setModalidad(filtro)}
                >
                  {filtro === 'todos' ? 'Todos' : filtro === 'envio' ? 'Envío' : 'Recojo'}
                </button>
              ))}
            </div>
          </div>
          {mostrarAviso && (
            <div className="bandeja-aviso">
              <Aviso>
                Los totales y fechas válidos están en los datos del pedido, no en los mensajes.
              </Aviso>
              <Boton
                variante="secundario"
                aria-label="Ocultar aviso"
                onClick={() => setMostrarAviso(false)}
              >
                Entendido
              </Boton>
            </div>
          )}
          {resultado.ordenes.length === 0 ? (
            <Aviso>
              Aún no tienes pedidos.{' '}
              {import.meta.env.MODE === 'web' ? (
                <Link to="/catalogo">Explorar piezas</Link>
              ) : (
                'Tus solicitudes aparecerán aquí.'
              )}
            </Aviso>
          ) : visibles.length === 0 ? (
            <Aviso>No hay pedidos que coincidan con tu búsqueda o filtro.</Aviso>
          ) : (
            <ul className="pedidos-lista">
              {visibles.map((orden) => (
                <li key={orden.id}>
                  <Link className="pedidos-fila" to={`/pedidos/${orden.id}`}>
                    <span className="pedido-avatar" aria-hidden="true">
                      {iniciales(nombrePedido(orden))}
                    </span>
                    <span className="pedidos-fila-titulo">{nombrePedido(orden)}</span>
                    <span className="texto-secundario">
                      {orden.nombre_contraparte || 'Nombre no disponible'}
                    </span>
                    <span className="pedido-estado" data-estado={orden.estado}>
                      {etiquetaEstado(orden.estado)}
                    </span>
                    <span className="texto-secundario">
                      {orden.cantidad} pieza(s) ·{' '}
                      {orden.modalidad === 'envio' ? 'envío por agencia' : 'recojo'}
                    </span>
                    <time dateTime={orden.creado_en} className="texto-secundario cifra">
                      {new Date(orden.creado_en).toLocaleString('es-PE', {
                        timeZone: 'America/Lima',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </time>
                    <span className="pedido-miniatura" aria-hidden="true">
                      {iniciales(nombrePedido(orden))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
