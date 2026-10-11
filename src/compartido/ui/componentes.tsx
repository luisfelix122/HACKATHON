import {
  useId,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Icono, type NombreIcono } from './Icono'

/* Componentes del mundo «Rotulado de chalana» (docs/decisiones/0006 y DESIGN.md). */

type Variante = 'primario' | 'secundario' | 'destacado' | 'peligro'

const CLASE_VARIANTE: Record<Variante, string> = {
  primario: 'boton',
  secundario: 'boton boton-secundario',
  destacado: 'boton boton-destacado',
  peligro: 'boton boton-peligro',
}

/**
 * Botón pintado de 48 px como mínimo, con sombra dura. `destacado` (sol) va una
 * sola vez por pantalla; `peligro` es para rechazar o cancelar. `icono` va
 * siempre junto a la etiqueta, nunca solo.
 */
export function Boton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variante?: Variante
    cargando?: boolean
    ancho?: boolean
    icono?: NombreIcono
  },
) {
  const {
    variante = 'primario',
    cargando = false,
    ancho = false,
    icono,
    className,
    children,
    ...resto
  } = props
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
    >
      {icono && !cargando && <Icono nombre={icono} />}
      {children}
    </button>
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
          {props.error && <Icono nombre="error" tamano={18} />}
          {descripcion}
        </span>
      )}
    </div>
  )
}

/** Paso numerado de un proceso del artesano: un paso por casilla, en orden. */
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

const ICONO_TONO: Record<Tono, NombreIcono> = {
  info: 'info',
  exito: 'exito',
  alerta: 'alerta',
  error: 'error',
  'sin-senal': 'sin-senal',
}

/** Aviso con `role="status"`; un error usa `role="alert"` para anunciarse de inmediato. */
export function Aviso({ tono = 'info', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <div className={`aviso aviso-${tono}`} role={tono === 'error' ? 'alert' : 'status'}>
      <Icono nombre={ICONO_TONO[tono]} />
      <div className="aviso-texto">{children}</div>
    </div>
  )
}

/** Emblema pintado de la acreditación. `pendiente` va punteado y sin pintura. */
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

/** Placa de matrícula: la caleta de una pieza o de un artesano. */
export function Matricula({ children }: { children: ReactNode }) {
  return <span className="matricula">{children}</span>
}

const ICONO_TIPO: Record<string, NombreIcono> = {
  textil: 'ovillo',
  'bisutería marina': 'concha',
  tallado: 'madera',
  utilitario: 'bolsa',
}

/**
 * Tablón pintado de una pieza: foto (o el aviso de que aún no hay), caleta,
 * título, quién la hizo y precio. Sin foto (o si no carga) no se inventa una imagen.
 */
export function Tablon(props: {
  titulo: string
  lugar: string
  artesano: string
  tipo: string
  precio?: string
  foto?: string
  children?: ReactNode
}) {
  const [fallida, setFallida] = useState<string | null>(null)
  const conFoto = props.foto && fallida !== props.foto
  return (
    <article className="tablon" data-tipo={props.tipo}>
      <div className="tablon-media">
        {conFoto ? (
          <img
            src={props.foto}
            alt={`Foto de ${props.titulo}`}
            loading="lazy"
            onError={() => setFallida(props.foto ?? null)}
          />
        ) : (
          <div className="tablon-sin-foto">
            <Icono nombre={ICONO_TIPO[props.tipo] ?? 'productos'} tamano={40} />
            <span>Sin foto todavía</span>
          </div>
        )}
      </div>
      <div className="tablon-cuerpo">
        <h3 className="tablon-titulo">{props.titulo}</h3>
        <p className="tablon-autor">
          <span>
            Hecho por <span className="tablon-artesano">{props.artesano}</span>
          </span>
          <Matricula>{props.lugar}</Matricula>
        </p>
        {props.precio && <p className="tablon-precio">{props.precio}</p>}
        {props.children}
      </div>
    </article>
  )
}

/** Franja de casco a sangre: una región de la página, con borda y línea de flotación. */
export function Franja({
  tono = 'casco',
  children,
  className,
  etiqueta,
}: {
  tono?: 'casco' | 'cal' | 'sol' | 'mar'
  children: ReactNode
  className?: string
  /** Nombre accesible de la región, si no tiene título visible. */
  etiqueta?: string
}) {
  return (
    <section
      className={['franja', `franja-${tono}`, className].filter(Boolean).join(' ')}
      aria-label={etiqueta}
    >
      <div className="franja-contenido">{children}</div>
    </section>
  )
}

/** Logotipo rotulado provisional: todavía no hay logo (fuera de alcance). */
export function Logotipo() {
  return (
    <span className="logotipo" role="img" aria-label="Ayllu">
      <span aria-hidden="true">
        Ayll<span className="logotipo-u">u</span>
      </span>
    </span>
  )
}
