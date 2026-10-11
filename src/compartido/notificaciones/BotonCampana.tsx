import { Link } from 'react-router-dom'
import { useNotificaciones } from './servicio'

export function BotonCampana() {
  const { noLeidas } = useNotificaciones()

  return (
    <Link
      to="/notificaciones"
      className="boton-campana-notificaciones"
      aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {noLeidas > 0 && (
        <span className="insignia-contador-notificaciones" aria-hidden="true">
          {noLeidas > 9 ? '9+' : noLeidas}
        </span>
      )}
    </Link>
  )
}
