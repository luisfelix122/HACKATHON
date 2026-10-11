import { Link } from 'react-router-dom'
import { Aviso, Boton } from '../ui/componentes'
import {
  marcarLeida,
  marcarTodasLeidas,
  limpiarNotificaciones,
  useNotificaciones,
  type Notificacion,
} from './servicio'
import './notificaciones.css'

function formatearFecha(iso: string): string {
  try {
    const fecha = new Date(iso)
    const ahora = new Date()
    const diffMs = ahora.getTime() - fecha.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    const diffHoras = Math.floor(diffMin / 60)
    if (diffHoras < 24) return `Hace ${diffHoras} h`
    return fecha.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function IconoTipo({ tipo }: { tipo: Notificacion['tipo'] }) {
  const atributos = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (tipo) {
    case 'pedido':
      return (
        <svg {...atributos}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    case 'mensaje':
      return (
        <svg {...atributos}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )
    case 'acreditacion':
      return (
        <svg {...atributos}>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    default:
      return (
        <svg {...atributos}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
  }
}

export function PantallaNotificaciones() {
  const { notificaciones, noLeidas } = useNotificaciones()

  return (
    <main className="pagina notificaciones-pagina" lang="es">
      <div className="notificaciones-cabecera">
        <div>
          <h1 className="notificaciones-titulo">Notificaciones</h1>
          <p className="notificaciones-subtitulo">
            Avisos de pedidos, consultas y actualizaciones de tu taller.
          </p>
        </div>
        {notificaciones.length > 0 && (
          <div className="notificaciones-acciones-cabecera">
            {noLeidas > 0 && (
              <Boton variante="secundario" onClick={marcarTodasLeidas}>
                Marcar todas leídas
              </Boton>
            )}
            <button
              type="button"
              className="boton-limpiar-historial"
              onClick={limpiarNotificaciones}
            >
              Vaciar historial
            </button>
          </div>
        )}
      </div>

      {notificaciones.length === 0 ? (
        <div className="notificaciones-vacio">
          <div className="notificaciones-vacio-icono" aria-hidden="true">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h2>Bandeja al día</h2>
          <p>
            No tienes avisos pendientes. Cuando un comprador realice un pedido o envíe un mensaje,
            lo verás aquí al instante con aviso sonoro y push.
          </p>
          <Aviso tono="info">
            Mantén la aplicación activa o en segundo plano para recibir alertas directas.
          </Aviso>
        </div>
      ) : (
        <ul className="notificaciones-lista" aria-label="Lista de notificaciones">
          {notificaciones.map((notif) => (
            <li
              key={notif.id}
              className={`tarjeta-notificacion ${notif.leida ? 'leida' : 'no-leida'}`}
            >
              <div className="notificacion-icono-contenedor" data-tipo={notif.tipo}>
                <IconoTipo tipo={notif.tipo} />
              </div>
              <div className="notificacion-contenido">
                <div className="notificacion-fila-superior">
                  <div className="notificacion-identificador">
                    {!notif.leida && <span className="indicador-no-leido" aria-label="No leída" />}
                    <h3 className="notificacion-item-titulo">{notif.titulo}</h3>
                  </div>
                  <time className="notificacion-hora" dateTime={notif.fecha}>
                    {formatearFecha(notif.fecha)}
                  </time>
                </div>
                <p className="notificacion-cuerpo">{notif.cuerpo}</p>
                <div className="notificacion-acciones">
                  {notif.enlace && (
                    <Link
                      to={notif.enlace}
                      className="boton-abrir-notificacion"
                      onClick={() => marcarLeida(notif.id)}
                    >
                      Ver detalle
                    </Link>
                  )}
                  {!notif.leida && (
                    <button
                      type="button"
                      className="boton-marcar-individual"
                      onClick={() => marcarLeida(notif.id)}
                    >
                      Leído
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
