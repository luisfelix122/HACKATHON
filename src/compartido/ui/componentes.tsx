import { useId, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react'

/* Componentes del sistema visual (docs/decisiones/0004-sistema-visual.md). */

type Variante = 'primario' | 'secundario' | 'destacado'

const CLASE_VARIANTE: Record<Variante, string> = {
  primario: 'boton',
  secundario: 'boton boton-secundario',
  destacado: 'boton boton-destacado',
}

/** Botón con estado de carga. `destacado` (sol) se usa una sola vez por pantalla. */
export function Boton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: Variante
    cargando?: boolean
    ancho?: boolean
  },
) {
  const { variante = 'primario', cargando = false, ancho = false, className, ...resto } = props
  const clases = [CLASE_VARIANTE[variante], ancho && 'boton-ancho', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type="button"
      {...resto}
      className={clases}
      disabled={resto.disabled || cargando}
      aria-busy={cargando || undefined}
    />
  )
}

/**
 * Campo con su etiqueta asociada, ayuda y error. El control llega como
 * `children` y recibe el `id` para que la etiqueta lo nombre.
 */
export function Campo(props: {
  etiqueta: string
  error?: string
  ayuda?: string
  children: (atributos: {
    id: string
    'aria-invalid'?: boolean
    'aria-describedby'?: string
  }) => ReactElement
}) {
  const id = useId()
  const idDescripcion = `${id}-descripcion`
  const describe = props.error || props.ayuda ? idDescripcion : undefined
  return (
    <div className="campo" data-error={props.error ? 'true' : undefined}>
      <label className="campo-etiqueta" htmlFor={id}>
        {props.etiqueta}
      </label>
      {props.children({
        id,
        'aria-invalid': props.error ? true : undefined,
        'aria-describedby': describe,
      })}
      {props.error ? (
        <span id={idDescripcion} className="campo-error">
          {props.error}
        </span>
      ) : (
        props.ayuda && (
          <span id={idDescripcion} className="campo-ayuda">
            {props.ayuda}
          </span>
        )
      )}
    </div>
  )
}

/** Casilla numerada de la guía: un paso del formulario del artesano. */
export function Casilla(props: { numero: number; children: ReactNode }) {
  return (
    <div className="casilla">
      <span className="casilla-numero" aria-hidden="true">
        {props.numero}
      </span>
      <div className="formulario">{props.children}</div>
    </div>
  )
}

type Tono = 'info' | 'exito' | 'alerta' | 'error' | 'sin-senal'

function Icono({ tono }: { tono: Tono }) {
  const comun = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  switch (tono) {
    case 'exito':
      return (
        <svg {...comun}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.6 2.6L16 9.5" />
        </svg>
      )
    case 'alerta':
    case 'error':
      return (
        <svg {...comun}>
          <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
          <path d="M12 10v4.5M12 17.5v.01" />
        </svg>
      )
    case 'sin-senal':
      return (
        <svg {...comun}>
          <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M12 20v.01" />
        </svg>
      )
    default:
      return (
        <svg {...comun}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5.5M12 7.5v.01" />
        </svg>
      )
  }
}

/** Aviso con rol `status` (o `alert` si es un error). */
export function Aviso({ tono = 'info', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <div className={`aviso aviso-${tono}`} role={tono === 'error' ? 'alert' : 'status'}>
      <Icono tono={tono} />
      <div>{children}</div>
    </div>
  )
}

/** Sello de acreditación. Pendiente se dibuja punteado y sin tinta. */
export function SelloRna({ estado }: { estado: 'aprobada' | 'pendiente' }) {
  if (estado === 'pendiente') {
    return (
      <span className="sello sello-pendiente" role="img" aria-label="RNA en revisión">
        <span>
          <span className="sello-rna">RNA</span>
          <br />
          <span className="sello-texto">en revisión</span>
        </span>
      </span>
    )
  }
  return (
    <span className="sello" role="img" aria-label="RNA verificado">
      <span>
        <span className="sello-rna">RNA</span>
        <br />
        <span className="sello-texto">verificado</span>
      </span>
    </span>
  )
}

/** Etiqueta de una pieza: lo que se cuelga de cada producto en la vitrina. */
export function Etiqueta(props: {
  titulo: string
  lugar: string
  artesano: string
  precio?: string
  nota?: string
}) {
  return (
    <article className="etiqueta">
      <span className="etiqueta-lugar">{props.lugar}</span>
      <h3 className="etiqueta-titulo">{props.titulo}</h3>
      <span>Hecho por {props.artesano}</span>
      {props.precio && <span className="etiqueta-precio">{props.precio}</span>}
      {props.nota && <span className="nota">{props.nota}</span>}
    </article>
  )
}

/** Logotipo tipográfico provisional (no hay logo todavía). */
export function Logotipo({ como = 'span' }: { como?: 'span' | 'a' }) {
  const contenido = (
    <>
      Ayll<span>u</span>
    </>
  )
  return como === 'a' ? (
    <a className="logotipo" href="/" aria-label="Ayllu, inicio">
      {contenido}
    </a>
  ) : (
    <span className="logotipo">{contenido}</span>
  )
}
