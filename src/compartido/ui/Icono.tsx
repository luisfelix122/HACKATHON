import type { ReactNode } from 'react'

/*
 * Juego de iconos de Ayllu (decisión 0006): trazo de 2,25 sobre 24 × 24, puntas
 * redondas, dibujado en el proyecto para no sumar una librería a la APK.
 * Un icono va siempre junto a su etiqueta visible; si va solo, recibe `etiqueta`.
 */
const TRAZOS = {
  // Navegación
  catalogo: (
    <>
      <path d="M3 14h18l-2.2 4.2a2 2 0 0 1-1.8 1.1H7a2 2 0 0 1-1.8-1.1Z" />
      <path d="M12 14V4l6 7.5h-6" />
    </>
  ),
  productos: (
    <>
      <path d="M4 9h16l-1.6 9.6a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7Z" />
      <path d="M8.5 9 11 4M15.5 9 13 4M9 13v3.5M15 13v3.5" />
    </>
  ),
  pedidos: (
    <>
      <path d="M12 3 20.5 7.5v9L12 21l-8.5-4.5v-9Z" />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
    </>
  ),
  cuenta: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20.5c1.4-3.6 4.4-5.5 8-5.5s6.6 1.9 8 5.5" />
    </>
  ),
  ingresar: (
    <>
      <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14" />
      <path d="M4 12h11M11 8l4 4-4 4" />
    </>
  ),
  salir: (
    <>
      <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <path d="M9 12h11M16 8l4 4-4 4" />
    </>
  ),
  nuevo: <path d="M12 5v14M5 12h14" />,
  editar: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
  borrar: (
    <>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  imagen: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m3.5 16 5-5 4 4 2.5-2.5 5.5 5.5" />
      <circle cx="15.5" cy="9.5" r="1.5" />
    </>
  ),
  ia: <path d="M12 3.5 13.8 10 20.5 12l-6.7 2L12 20.5 10.2 14 3.5 12l6.7-2Z" />,
  candado: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  sincronizar: (
    <path d="M19.5 9A8 8 0 0 0 5 7.5M4.5 15a8 8 0 0 0 14.5 1.5M19.5 4v5h-5M4.5 20v-5h5" />
  ),
  admin: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.4 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5.1 7.5-9.5V6Z" />
      <path d="m8.8 12.2 2.3 2.3 4.3-4.6" />
    </>
  ),
  // Acciones
  buscar: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  atras: <path d="M19 12H5M11 6l-6 6 6 6" />,
  adelante: <path d="M5 12h14M13 6l6 6-6 6" />,
  mensaje: <path d="M4 5.5h16v10.5H9l-5 4Z" />,
  camara: (
    <>
      <path d="M4 8h3.5L9 5.5h6L16.5 8H20v11H4Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  microfono: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
  ubicacion: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </>
  ),
  envio: (
    <>
      <path d="M3 6.5h11v9.5H3ZM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </>
  ),
  pago: (
    <>
      <rect x="3" y="6" width="18" height="12.5" rx="1.5" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  // Tipos de producto (docs/dominio.md)
  ovillo: (
    <>
      <path d="M6 3.5h11M6 20.5h11M8 3.5v17M15 3.5v17" />
      <path d="M8 7.5h7M8 10.5h7M8 13.5h7M8 16.5h7" />
      <path d="M15 16.5c2.5 0 4 1.2 4 3.5" />
    </>
  ),
  concha: (
    <>
      <path d="M12 20.5 3.5 10.5C5.5 6 8.6 3.5 12 3.5s6.5 2.5 8.5 7Z" />
      <path d="M12 20.5V3.5M12 20.5 7.2 5.2M12 20.5l4.8-15.3" />
    </>
  ),
  madera: (
    <>
      <ellipse cx="7" cy="12" rx="3.5" ry="6.5" />
      <path d="M7 5.5h11c1.9 0 3.5 2.9 3.5 6.5s-1.6 6.5-3.5 6.5H7" />
      <ellipse cx="7" cy="12" rx="1.2" ry="2.4" />
    </>
  ),
  bolsa: (
    <>
      <path d="M5 8.5h14l-1 12H6Z" />
      <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
    </>
  ),
  // Estados
  exito: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.6 2.6L16 9.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.01" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3.5 21.5 20h-19Z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  'sin-senal': (
    <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M12 20v.01" />
  ),
} satisfies Record<string, ReactNode>

export type NombreIcono = keyof typeof TRAZOS

/**
 * Icono de trazo. Sin `etiqueta` es decorativo (`aria-hidden`); con `etiqueta`
 * se anuncia como imagen con ese nombre, para cuando va sin texto al lado.
 */
export function Icono({
  nombre,
  etiqueta,
  tamano = 24,
}: {
  nombre: NombreIcono
  etiqueta?: string
  tamano?: number
}) {
  return (
    <svg
      className="icono"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...(etiqueta ? { role: 'img', 'aria-label': etiqueta } : { 'aria-hidden': true })}
    >
      {TRAZOS[nombre]}
    </svg>
  )
}
