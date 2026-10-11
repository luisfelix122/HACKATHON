import { useEffect, useState } from 'react'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { Link, useNavigate } from 'react-router-dom'
import { obtenerSupabase } from '../supabase'
import { mostrarAvisoSistema, prepararAvisosSistema } from './avisoSistema'
import { Modal } from '../ui/Modal'
import './notificaciones.css'

type Novedad = { id: string; orden: string; texto: string; fecha: string; leida: boolean }

/** Novedades de esta sesión; RLS limita los eventos a las partes del pedido. */
export function CampanaNotificaciones({ usuarioId }: { usuarioId?: string }) {
  return usuarioId ? <CampanaSesion key={usuarioId} usuarioId={usuarioId} /> : null
}

function CampanaSesion({ usuarioId }: { usuarioId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [novedades, setNovedades] = useState<Novedad[]>([])
  const [conexion, setConexion] = useState('Conectando las notificaciones…')
  const [intento, setIntento] = useState(0)
  const pendientes = novedades.filter((item) => !item.leida).length
  const navegar = useNavigate()

  useEffect(
    () => prepararAvisosSistema((orden) => navegar(`/pedidos/${encodeURIComponent(orden)}`)),
    [navegar],
  )

  useEffect(() => {
    let activo = true
    let cliente: SupabaseClient | undefined
    let canal: RealtimeChannel | undefined
    try {
      cliente = obtenerSupabase()
      const recibir = (novedad: Novedad) => {
        if (!activo) return
        setNovedades((actuales) =>
          [novedad, ...actuales.filter((item) => item.id !== novedad.id)].slice(0, 30),
        )
        mostrarAvisoSistema(novedad)
      }
      canal = cliente.channel(`novedades-${usuarioId}-${crypto.randomUUID()}`)
      canal
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orden' },
          ({ new: orden }) => {
            if (orden.comprador_id !== usuarioId)
              recibir({
                id: `orden-${orden.id}`,
                orden: orden.id,
                texto: 'Recibiste una nueva solicitud de pedido.',
                fecha: orden.creado_en,
                leida: false,
              })
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orden' },
          ({ new: orden }) => {
            recibir({
              id: `orden-${orden.id}-${orden.actualizado_en}`,
              orden: orden.id,
              texto: `Tu pedido está ${String(orden.estado).replaceAll('_', ' ')}.`,
              fecha: orden.actualizado_en,
              leida: false,
            })
          },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mensaje_orden' },
          ({ new: mensaje }) => {
            if (mensaje.autor_id !== usuarioId)
              recibir({
                id: `mensaje-${mensaje.id}`,
                orden: mensaje.orden_id,
                texto: 'Tienes un nuevo mensaje en tu pedido.',
                fecha: mensaje.creado_en,
                leida: false,
              })
          },
        )
        .subscribe((estado) => {
          if (!activo) return
          setConexion(
            estado === 'SUBSCRIBED'
              ? 'Notificaciones conectadas mientras la app está abierta.'
              : ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(estado)
                ? 'No pudimos conectar las notificaciones. Revisa tu conexión.'
                : 'Conectando las notificaciones…',
          )
        })
      const sinConexion = () => setConexion('Sin conexión. Las novedades volverán al reconectar.')
      const reconectar = () => setIntento((valor) => valor + 1)
      window.addEventListener('offline', sinConexion)
      window.addEventListener('online', reconectar)
      return () => {
        activo = false
        window.removeEventListener('offline', sinConexion)
        window.removeEventListener('online', reconectar)
        if (canal) void cliente?.removeChannel(canal).catch(() => {})
      }
    } catch {
      if (canal) void cliente?.removeChannel(canal).catch(() => {})
      void Promise.resolve().then(() => {
        if (activo)
          setConexion('Las notificaciones no están disponibles. Puedes revisar tus pedidos.')
      })
      return () => {
        activo = false
      }
    }
  }, [usuarioId, intento])

  return (
    <>
      <button
        type="button"
        className="campana-notificaciones"
        aria-label={`Notificaciones${pendientes ? `: ${pendientes} sin leer` : ''}`}
        aria-haspopup="dialog"
        onClick={() => setAbierto(true)}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
          <path d="M10 21h4M12 2V1" />
        </svg>
        {pendientes > 0 && (
          <span className="campana-contador" aria-hidden="true">
            {pendientes}
          </span>
        )}
      </button>
      <Modal abierto={abierto} titulo="Notificaciones" alCerrar={() => setAbierto(false)}>
        <p role="status">{conexion}</p>
        {!conexion.startsWith('Notificaciones conectadas') && (
          <button type="button" onClick={() => setIntento((valor) => valor + 1)}>
            Reconectar
          </button>
        )}
        {novedades.length === 0 ? (
          <p>No hay novedades recibidas en esta sesión. Puedes revisar tus pedidos anteriores.</p>
        ) : (
          <ul className="notificaciones-lista">
            {novedades.map((novedad) => (
              <li key={novedad.id}>
                <Link
                  to={`/pedidos/${encodeURIComponent(novedad.orden)}`}
                  onClick={() => {
                    setAbierto(false)
                    setNovedades((actuales) =>
                      actuales.map((item) =>
                        item.id === novedad.id ? { ...item, leida: true } : item,
                      ),
                    )
                  }}
                >
                  <span>
                    {!novedad.leida && <span className="solo-lectores">Sin leer: </span>}
                    {novedad.texto}
                  </span>
                  <time dateTime={novedad.fecha}>
                    {new Date(novedad.fecha).toLocaleString('es-PE', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/pedidos" onClick={() => setAbierto(false)}>
          Ver todos mis pedidos
        </Link>
      </Modal>
    </>
  )
}
