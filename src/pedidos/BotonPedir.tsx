import { Boton } from '../compartido/ui/componentes'

/**
 * Stub de la Fase 0 (PRP 012): la vitrina (módulo B) lo importa y el módulo C
 * (PRP 005) lo implementa sin cambiar esta firma.
 */
export function BotonPedir({ productoId }: { productoId: string }) {
  return (
    <div className="boton-pedir" data-producto-id={productoId}>
      <Boton variante="destacado" disabled aria-describedby={`pedir-${productoId}`}>
        Pedir
      </Boton>
      <span id={`pedir-${productoId}`} className="texto-secundario">
        Muy pronto
      </span>
    </div>
  )
}
