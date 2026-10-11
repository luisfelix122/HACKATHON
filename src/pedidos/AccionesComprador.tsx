import { useState } from 'react'
import type { Orden } from '../compartido/dominio/orden'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { Modal } from '../compartido/ui/Modal'
import { accionesVisibles } from './estadoOrden'
import { enlaceHttps, useAccionOrden } from './acciones'
export function AccionesComprador({ orden, alCambiar }: { orden: Orden; alCambiar: () => void }) {
  const { pendiente, error, ejecutar } = useAccionOrden(orden, alCambiar)
  const acciones = accionesVisibles('comprador', orden.estado, orden.modalidad)
  const pago = enlaceHttps(orden.enlace_pago)
  const [cancelando, setCancelando] = useState(false)
  return (
    <section className="pedido-acuerdo pedido-siguiente" aria-label="Acciones del comprador">
      <h2>Siguiente paso</h2>
      {error && !cancelando && <Aviso tono="error">{error}</Aviso>}
      {acciones.includes('confirmar_total') && (
        <Boton
          variante="destacado"
          icono="exito"
          cargando={pendiente}
          onClick={() => void ejecutar('confirmar_total')}
        >
          Confirmar total
        </Boton>
      )}
      {orden.estado === 'pago_pendiente' &&
        (pago ? (
          <>
            <a
              href={pago}
              target="_blank"
              rel="noopener noreferrer"
              className="boton boton-destacado"
            >
              <Icono nombre="pago" />
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
    </section>
  )
}
