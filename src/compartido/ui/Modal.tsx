import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icono } from './Icono'

const ENFOCABLES =
  'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

/**
 * Modal sobre `<dialog>` nativo (decisión 0006): fondo inerte, `Esc` cierra y el
 * foco vuelve a quien lo abrió. Para formularios cortos, confirmaciones y
 * acciones secundarias; los formularios largos y los pasos van en pantalla completa.
 *
 * El contenido nunca se desmonta al cerrar: lo escrito se conserva hasta que la
 * pantalla que lo usa decida limpiarlo (por ejemplo, después de enviar bien).
 */
export function Modal(props: {
  abierto: boolean
  titulo: string
  descripcion?: string
  alCerrar: () => void
  children: ReactNode
  /** Botones al pie (por ejemplo, Cancelar y la acción principal). */
  acciones?: ReactNode
}) {
  const { abierto, alCerrar } = props
  const dialogo = useRef<HTMLDialogElement>(null)
  const cuerpo = useRef<HTMLDivElement>(null)
  const disparador = useRef<HTMLElement | null>(null)
  const idTitulo = useId()
  const idDescripcion = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (abierto && !elemento.open) {
      disparador.current = document.activeElement as HTMLElement | null
      elemento.showModal()
      // Sin campos, el foco va al botón «Cerrar».
      const primero =
        cuerpo.current?.querySelector<HTMLElement>(ENFOCABLES) ??
        elemento.querySelector<HTMLElement>('.modal-cerrar')
      primero?.focus()
    } else if (!abierto && elemento.open) {
      elemento.close()
      disparador.current?.focus()
      disparador.current = null
    }
  }, [abierto])

  // Si la pantalla desmonta el modal abierto (por ejemplo, porque la acción salió
  // bien y cambió el estado), el foco vuelve a quien lo abrió o al título de la página.
  useEffect(() => {
    // Al desmontar, React ya soltó la referencia: se guarda el elemento al montar.
    const elemento = dialogo.current
    return () => {
      if (!elemento?.open) return
      const destino = disparador.current?.isConnected
        ? disparador.current
        : document.querySelector<HTMLElement>('main h1')
      if (destino && !destino.hasAttribute('tabindex') && destino.tagName === 'H1')
        destino.setAttribute('tabindex', '-1')
      destino?.focus()
    }
  }, [])

  return (
    <dialog
      ref={dialogo}
      className="modal"
      aria-labelledby={idTitulo}
      aria-describedby={props.descripcion ? idDescripcion : undefined}
      onCancel={(evento) => {
        // Esc: el navegador cerraría el diálogo por su cuenta; lo decide la pantalla.
        evento.preventDefault()
        alCerrar()
      }}
    >
      <header className="modal-cabecera">
        <h2 id={idTitulo} className="modal-titulo">
          {props.titulo}
        </h2>
        <button type="button" className="modal-cerrar" onClick={alCerrar}>
          <Icono nombre="cerrar" />
          <span className="solo-lectores">Cerrar</span>
        </button>
      </header>
      <div ref={cuerpo} className="modal-cuerpo">
        {props.descripcion && (
          <p id={idDescripcion} className="texto-secundario">
            {props.descripcion}
          </p>
        )}
        {props.children}
      </div>
      {props.acciones && <footer className="modal-acciones">{props.acciones}</footer>}
    </dialog>
  )
}
