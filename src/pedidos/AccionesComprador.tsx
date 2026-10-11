import type { Orden } from '../compartido/dominio/orden'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { accionesVisibles } from './estadoOrden'
import { enlaceHttps, useAccionOrden } from './acciones'
export function AccionesComprador({ orden, alCambiar }: { orden: Orden; alCambiar: () => void }) {
  const { pendiente, error, ejecutar } = useAccionOrden(orden, alCambiar)
  const acciones = accionesVisibles('comprador', orden.estado, orden.modalidad)
  const pago = enlaceHttps(orden.enlace_pago)
  return (
    <section className="pedido-acuerdo" aria-label="Acciones del comprador">
      <h2>Siguiente paso</h2>
      {error && <Aviso tono="error">{error}</Aviso>}
      {acciones.includes('confirmar_total') && (
        <Boton cargando={pendiente} onClick={() => void ejecutar('confirmar_total')}>
          Confirmar total
        </Boton>
      )}
      {orden.estado === 'pago_pendiente' &&
        (pago ? (
          <>
            <a href={pago} target="_blank" rel="noopener noreferrer" className="boton">
              Abrir enlace de pago
            </a>
            <p>
              El pago se realiza fuera de Ayllu. El artesano verificará el abono; puedes escribirle
              en el hilo.
            </p>
          </>
        ) : (
          <Aviso tono="alerta">El enlace no es válido. Pide al artesano que lo revise.</Aviso>
        ))}
      {orden.estado === 'enviada' && (
        <>
          <p>Número de guía: {orden.numero_guia}</p>
          <a
            className="boton"
            href="https://shalom.com.pe/rastrea"
            target="_blank"
            rel="noopener noreferrer"
          >
            Rastrear envío
          </a>
        </>
      )}
      {acciones.includes('cancelar_orden') && (
        <Boton
          variante="secundario"
          cargando={pendiente}
          onClick={() => void ejecutar('cancelar_orden')}
        >
          Cancelar pedido
        </Boton>
      )}
    </section>
  )
}
