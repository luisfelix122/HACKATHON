import { useId, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react'

/* Componentes del sistema visual (docs/decisiones/0004-sistema-visual.md y DESIGN.md). */

type Variante = 'primario' | 'secundario' | 'destacado'

const CLASE_VARIANTE: Record<Variante, string> = {
  primario: 'boton',
  secundario: 'boton boton-secundario',
  destacado: 'boton boton-destacado',
}

/** Botón de 48 px como mínimo. `destacado` (sol) se usa una sola vez por pantalla. */
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

type AtributosControl = {
  id: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

/**
 * Campo con su etiqueta, ayuda y error. El control llega como función hija y
 * recibe el `id` y los atributos ARIA, para que sirva con input, select o textarea.
 */
export function Campo(props: {
  etiqueta: string
  ayuda?: string
  error?: string
  children: (atributos: AtributosControl) => ReactElement
}) {
  const id = useId()
  const idDescripcion = `${id}-descripcion`
  const descripcion = props.error ?? props.ayuda
  return (
    <div className="campo" data-error={props.error ? 'true' : undefined}>
      <label className="campo-etiqueta" htmlFor={id}>
        {props.etiqueta}
      </label>
      {props.children({
        id,
        'aria-invalid': props.error ? true : undefined,
        'aria-describedby': descripcion ? idDescripcion : undefined,
      })}
      {descripcion && (
        <span id={idDescripcion} className={props.error ? 'campo-error' : 'campo-ayuda'}>
          {descripcion}
        </span>
      )}
    </div>
  )
}

/** Casilla numerada de la guía: agrupa un paso del formulario del artesano. */
export function Casilla(props: { numero: number; titulo: string; children: ReactNode }) {
  const id = useId()
  return (
    <section className="casilla" role="group" aria-labelledby={id}>
      <span className="casilla-numero" aria-hidden="true">
        {props.numero}
      </span>
      <div className="casilla-cuerpo">
        <h2 id={id} className="casilla-titulo">
          <span className="solo-lectores">{`Paso ${props.numero}:`}</span> {props.titulo}
        </h2>
        {props.children}
      </div>
    </section>
  )
}

type Tono = 'info' | 'exito' | 'alerta' | 'error' | 'sin-senal'

const TRAZO = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

function Icono({ tono }: { tono: Tono }) {
  switch (tono) {
    case 'exito':
      return (
        <svg {...TRAZO}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.6 2.6L16 9.5" />
        </svg>
      )
    case 'alerta':
      return (
        <svg {...TRAZO}>
          <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
          <path d="M12 10v4.5M12 17.5v.01" />
        </svg>
      )
    case 'error':
      return (
        <svg {...TRAZO}>
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </svg>
      )
    case 'sin-senal':
      return (
        <svg {...TRAZO}>
          <path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M12 20v.01" />
        </svg>
      )
    case 'info':
      return (
        <svg {...TRAZO}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5.5M12 7.5v.01" />
        </svg>
      )
  }
}

/** Aviso con `role="status"`; un error usa `role="alert"` para anunciarse de inmediato. */
export function Aviso({ tono = 'info', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <div className={`aviso aviso-${tono}`} role={tono === 'error' ? 'alert' : 'status'}>
      <Icono tono={tono} />
      <div className="aviso-texto">{children}</div>
    </div>
  )
}

/** Sello de acreditación. `pendiente` se dibuja punteado y sin tinta. */
export function SelloRna({ estado }: { estado: 'aprobada' | 'pendiente' }) {
  const aprobada = estado === 'aprobada'
  return (
    <span
      className={aprobada ? 'sello' : 'sello sello-pendiente'}
      role="img"
      aria-label={aprobada ? 'RNA verificado' : 'RNA en revisión'}
    >
      <span className="sello-rna">RNA</span>
      <span className="sello-texto">{aprobada ? 'verificado' : 'en revisión'}</span>
    </span>
  )
}

/** Etiqueta colgante de una pieza: lugar, título, quién la hizo y precio opcional. */
export function Etiqueta(props: {
  titulo: string
  lugar: string
  artesano: string
  precio?: string
  children?: ReactNode
}) {
  return (
    <article className="etiqueta">
      <span className="etiqueta-lugar">{props.lugar}</span>
      <h3 className="etiqueta-titulo">{props.titulo}</h3>
      <span className="etiqueta-autor">Hecho por {props.artesano}</span>
      {props.precio && <span className="etiqueta-precio">{props.precio}</span>}
      {props.children}
    </article>
  )
}

/** Logotipo tipográfico provisional: todavía no hay logo (PRP 011, fuera de alcance). */
export function Logotipo() {
  return (
    <span className="logotipo">
      Ayll<span className="logotipo-u">u</span>
    </span>
  )
}
