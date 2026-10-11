import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Orden } from '../compartido/dominio/orden'
import { useSesion } from '../compartido/sesion'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { listarOrdenes } from './consultas'
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
          {error} <Boton onClick={() => setIntento((valor) => valor + 1)}>Reintentar</Boton>
        </Aviso>
      ) : !resultado || resultado.usuario !== id ? (
        <Aviso>Cargando…</Aviso>
      ) : (
        <>
          <Boton variante="secundario" onClick={() => setIntento((valor) => valor + 1)}>
            Actualizar
          </Boton>
          {resultado.ordenes.length === 0 ? (
            <Aviso>
              Aún no tienes pedidos.{' '}
              {import.meta.env.MODE === 'web' ? (
                <Link to="/">Explorar piezas</Link>
              ) : (
                'Tus solicitudes aparecerán aquí.'
              )}
            </Aviso>
          ) : (
            <ul className="pedidos-lista">
              {resultado.ordenes.map((orden) => (
                <li key={orden.id}>
                  <Link to={`/pedidos/${orden.id}`}>Pedido {orden.id.slice(0, 8)}</Link>
                  <span>
                    {orden.estado.replaceAll('_', ' ')} · {orden.cantidad} pieza(s) ·{' '}
                    {orden.modalidad}
                  </span>
                  <time dateTime={orden.creado_en}>
                    {new Date(orden.creado_en).toLocaleDateString('es-PE', {
                      timeZone: 'America/Lima',
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  )
}
