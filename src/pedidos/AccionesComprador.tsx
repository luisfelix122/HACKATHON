import { useState } from 'react'
import type { Orden } from '../compartido/dominio/orden'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { Modal } from '../compartido/ui/Modal'
import { accionesVisibles } from './estadoOrden'
import { enlaceHttps, useAccionOrden } from './acciones'
import { ComoPagar } from './PagoOrden'
export function AccionesComprador({
  orden,
  artesanoId,
  alCambiar,
}: {
  orden: Orden
  artesanoId?: string | null
  alCambiar: () => void
}) {
  const { pendiente, error, ejecutar } = useAccionOrden(orden, alCambiar)
  const acciones = accionesVisibles('comprador', orden.estado, orden.modalidad)
  const pago = enlaceHttps(orden.enlace_pago)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  return (
    <section
      id="pedido-acciones"
      className="pedido-acuerdo pedido-siguiente"
      aria-label="Acciones del comprador"
    >
      <h2>Siguiente paso</h2>
      {error && !cancelando && !confirmando && <Aviso tono="error">{error}</Aviso>}
      {acciones.includes('confirmar_total') && (
        <Boton
          variante="destacado"
          icono="exito"
          cargando={pendiente}
          onClick={() => setConfirmando(true)}
        >
          Confirmar total
        </Boton>
      )}
      {orden.estado === 'pago_pendiente' && (
        <ComoPagar artesanoId={artesanoId} enlace={pago} total={orden.total} />
      )}
      {orden.estado === 'enviada' && (
        <>
          <p className="pedido-guia cifra">Número de guía: {orden.numero_guia}</p>
          <a
            className="boton"
            href="https://shalom.com.pe/rastrea"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icono nombre="envio" />
            Rastrear envío
          </a>
        </>
      )}
      {acciones.includes('cancelar_orden') && (
        <Boton variante="peligro" icono="cerrar" onClick={() => setCancelando(true)}>
          Cancelar pedido
        </Boton>
      )}
      <Modal
        abierto={cancelando}
        titulo="¿Cancelar este pedido?"
        descripcion="El pedido queda cancelado para las dos partes. No se puede deshacer."
        alCerrar={() => setCancelando(false)}
        ocupado={pendiente}
        acciones={
          <>
            <Boton variante="secundario" onClick={() => setCancelando(false)}>
              Volver
            </Boton>
            <Boton
              variante="peligro"
              icono="cerrar"
              cargando={pendiente}
              onClick={() => void ejecutar('cancelar_orden')}
            >
              Cancelar pedido
            </Boton>
          </>
        }
      >
        {cancelando && error && <Aviso tono="error">{error}</Aviso>}
      </Modal>
      <Modal
        abierto={confirmando}
        titulo="¿Confirmar el total acordado?"
        alCerrar={() => setConfirmando(false)}
        ocupado={pendiente}
        acciones={
          <>
            <Boton variante="secundario" disabled={pendiente} onClick={() => setConfirmando(false)}>
              Volver
            </Boton>
            <Boton
              variante="destacado"
              cargando={pendiente}
              onClick={() => void ejecutar('confirmar_total')}
            >
              Confirmar acuerdo
            </Boton>
          </>
        }
      >
        <p>
          Total: {orden.total === null ? 'Pendiente' : 'S/ ' + orden.total.toFixed(2)}. Fecha
          estimada: {orden.fecha_entrega_estimada ?? 'Pendiente'}.
        </p>
        {confirmando && error && <Aviso tono="error">{error}</Aviso>}
      </Modal>
    </section>
  )
}
