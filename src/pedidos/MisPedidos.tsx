import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Orden } from '../compartido/dominio/orden'
import { useSesion } from '../compartido/sesion'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { listarOrdenes } from './consultas'
import { contarEnCurso, etiquetaEstado } from './estadoOrden'
import './pedidos.css'

export function MisPedidos() {
  const { sesion, cargando } = useSesion()
  const ubicacion = useLocation()
  const [resultado, setResultado] = useState<{ usuario: string; ordenes: Orden[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)
  const id = sesion?.user.id
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
  return (
    <main className="pagina pagina-artesano pedidos">
      <h1>Mis pedidos</h1>
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
          {error}{' '}
          <Boton icono="adelante" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar
          </Boton>
        </Aviso>
      ) : !resultado || resultado.usuario !== id ? (
        <Aviso>Cargando…</Aviso>
      ) : (
        <>
          {import.meta.env.MODE === 'artesano' && (
            <Aviso>Tienes {contarEnCurso(resultado.ordenes)} pedidos en curso.</Aviso>
          )}
          <Boton
            variante="secundario"
            icono="adelante"
            onClick={() => setIntento((valor) => valor + 1)}
          >
            Actualizar
          </Boton>
          {resultado.ordenes.length === 0 ? (
            <Aviso>
              Aún no tienes pedidos.{' '}
              {import.meta.env.MODE === 'web' ? (
                <Link to="/catalogo">Explorar piezas</Link>
              ) : (
                'Tus solicitudes aparecerán aquí.'
              )}
            </Aviso>
          ) : (
            <ul className="pedidos-lista">
              {resultado.ordenes.map((orden) => (
                <li key={orden.id}>
                  <Link className="pedidos-fila" to={`/pedidos/${orden.id}`}>
                    <span className="pedidos-fila-titulo">
                      <Icono nombre="pedidos" />
                      Pedido <span className="cifra">{orden.id.slice(0, 8)}</span>
                    </span>
                    <span className="pedido-estado" data-estado={orden.estado}>
                      {etiquetaEstado(orden.estado)}
                    </span>
                    <span className="texto-secundario">
                      {orden.cantidad} pieza(s) ·{' '}
                      {orden.modalidad === 'envio' ? 'envío por agencia' : 'recojo'}
                    </span>
                    <time dateTime={orden.creado_en} className="texto-secundario cifra">
                      {new Date(orden.creado_en).toLocaleDateString('es-PE', {
                        timeZone: 'America/Lima',
                      })}
                    </time>
                    <Icono nombre="adelante" />
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
