import { useState } from 'react'
import type { Orden } from '../compartido/dominio/orden'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { Modal } from '../compartido/ui/Modal'
import { accionesVisibles, avisoCarga } from './estadoOrden'
import { enlaceHttps, useAccionOrden, type ContextoAcciones } from './acciones'
import { estimarEntrega, hoyLima } from './estimarEntrega'

/*
 * Acciones del artesano sobre una orden. Los formularios cortos y las
 * confirmaciones van en modales (CC-17). DetalleOrden remonta este componente
 * cuando cambia el estado de la orden, así que un modal se cierra solo cuando su
 * acción sale bien; si falla, sigue abierto con el error y lo escrito.
 */
type Dialogo =
  | 'aceptar_orden'
  | 'rechazar_orden'
  | 'enviar_enlace_pago'
  | 'verificar_abono'
  | 'marcar_enviada'
  | 'cancelar_orden'
  | 'marcar_lista_recojo'
  | 'marcar_entregada'

export function AccionesArtesano({
  orden,
  contexto,
  alCambiar,
}: {
  orden: Orden
  contexto: ContextoAcciones
  alCambiar: () => void
}) {
  const acciones = accionesVisibles('artesano', orden.estado, orden.modalidad)
  const { pendiente, error, ejecutar } = useAccionOrden(orden, alCambiar)
  const [dialogo, setDialogo] = useState<Dialogo | null>(null)
  const [envio, setEnvio] = useState('0')
  const [total, setTotal] = useState(
    contexto.producto?.precio_final ? String(contexto.producto.precio_final * orden.cantidad) : '',
  )
  const [fecha, setFecha] = useState(() =>
    contexto.producto?.disponibilidad
      ? estimarEntrega(
          contexto.producto.disponibilidad,
          contexto.producto.plazo_dias,
          orden.modalidad,
          orden.datos_envio?.departamento ?? null,
        )
      : hoyLima(),
  )
  const [enlace, setEnlace] = useState('')
  const [guia, setGuia] = useState('')
  const aviso = contexto.enCurso === null ? null : avisoCarga(contexto.enCurso)
  const cerrar = () => setDialogo(null)
  const errorEn = (d: Dialogo) =>
    dialogo === d && error ? <Aviso tono="error">{error}</Aviso> : null

  return (
    <section
      id="pedido-acciones"
      className="pedido-acuerdo pedido-siguiente"
      aria-label="Acciones del artesano"
    >
      <h2>Siguiente paso</h2>
      {error && !dialogo && <Aviso tono="error">{error}</Aviso>}
      <div className="pedido-botones">
        {acciones.includes('aceptar_orden') && (
          <Boton variante="destacado" icono="exito" onClick={() => setDialogo('aceptar_orden')}>
            Aceptar pedido
          </Boton>
        )}
        {acciones.includes('enviar_enlace_pago') && (
          <Boton icono="pago" onClick={() => setDialogo('enviar_enlace_pago')}>
            Enviar enlace de pago
          </Boton>
        )}
        {acciones.includes('verificar_abono') && (
          <Boton icono="exito" onClick={() => setDialogo('verificar_abono')}>
            Verificar abono
          </Boton>
        )}
        {acciones.includes('marcar_enviada') && (
          <Boton icono="envio" onClick={() => setDialogo('marcar_enviada')}>
            Marcar enviada
          </Boton>
        )}
        {acciones.includes('marcar_lista_recojo') && (
          <Boton
            icono="exito"
            cargando={pendiente}
            onClick={() => setDialogo('marcar_lista_recojo')}
          >
            Lista para recojo
          </Boton>
        )}
        {acciones.includes('marcar_entregada') && (
          <Boton icono="exito" cargando={pendiente} onClick={() => setDialogo('marcar_entregada')}>
            Marcar entregada
          </Boton>
        )}
        {acciones.includes('rechazar_orden') && (
          <Boton variante="peligro" icono="cerrar" onClick={() => setDialogo('rechazar_orden')}>
            Rechazar pedido
          </Boton>
        )}
        {acciones.includes('cancelar_orden') && (
          <Boton variante="peligro" icono="cerrar" onClick={() => setDialogo('cancelar_orden')}>
            Cancelar pedido
          </Boton>
        )}
      </div>

      <Modal
        abierto={dialogo === 'aceptar_orden'}
        titulo="Aceptar el pedido"
        descripcion="El comprador verá este total y esta fecha, y los confirmará."
        alCerrar={cerrar}
        ocupado={pendiente}
      >
        <form
          className="pedido-modal-formulario"
          onSubmit={(evento) => {
            evento.preventDefault()
            void ejecutar('aceptar_orden', {
              costo_envio: orden.modalidad === 'envio' ? Number(envio) : null,
              total: Number(total),
              fecha_entrega_estimada: fecha,
            })
          }}
        >
          {aviso && <Aviso tono="alerta">{aviso}</Aviso>}
          {errorEn('aceptar_orden')}
          <fieldset disabled={pendiente}>
            <legend className="solo-lectores">Cotización y entrega</legend>
            {orden.modalidad === 'envio' && (
              <Campo etiqueta="Costo de envío (S/)">
                {(atributos) => (
                  <input
                    {...atributos}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    required
                    value={envio}
                    onChange={(e) => setEnvio(e.target.value)}
                  />
                )}
              </Campo>
            )}
            <Campo etiqueta="Total acordado (S/)" ayuda="Incluye todas las piezas y el envío.">
              {(atributos) => (
                <input
                  {...atributos}
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  max="99999999.99"
                  step="0.01"
                  required
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Fecha estimada de entrega"
              ayuda="Estimación por plazo y destino; puedes corregirla."
            >
              {(atributos) => (
                <input
                  {...atributos}
                  type="date"
                  min={hoyLima()}
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              )}
            </Campo>
          </fieldset>
          <div className="modal-acciones pedido-modal-acciones">
            <Boton variante="secundario" onClick={cerrar}>
              Volver
            </Boton>
            <Boton type="submit" variante="destacado" icono="exito" cargando={pendiente}>
              Aceptar pedido
            </Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={dialogo === 'enviar_enlace_pago'}
        titulo="Enviar enlace de pago"
        descripcion="Pega el enlace de cobro de tu proveedor (por ejemplo, Izipay)."
        alCerrar={cerrar}
      >
        <form
          className="pedido-modal-formulario"
          onSubmit={(e) => {
            e.preventDefault()
            if (enlaceHttps(enlace)) void ejecutar('enviar_enlace_pago', { enlace_pago: enlace })
          }}
        >
          {errorEn('enviar_enlace_pago')}
          <Campo etiqueta="Enlace de pago" ayuda="Debe comenzar con https://.">
            {(atributos) => (
              <input
                {...atributos}
                type="url"
                inputMode="url"
                pattern="https://.*"
                required
                disabled={pendiente}
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
              />
            )}
          </Campo>
          <div className="modal-acciones pedido-modal-acciones">
            <Boton variante="secundario" onClick={cerrar}>
              Volver
            </Boton>
            <Boton type="submit" icono="pago" disabled={!enlaceHttps(enlace)} cargando={pendiente}>
              Enviar enlace de pago
            </Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={dialogo === 'verificar_abono'}
        titulo="¿Ya viste el abono?"
        descripcion="Comprueba el abono en tu cuenta antes de marcarlo como pagado. Una captura del comprador no basta."
        alCerrar={cerrar}
        acciones={
          <>
            <Boton variante="secundario" onClick={cerrar}>
              Todavía no
            </Boton>
            <Boton
              icono="exito"
              cargando={pendiente}
              onClick={() => void ejecutar('verificar_abono')}
            >
              Verificar abono
            </Boton>
          </>
        }
      >
        {errorEn('verificar_abono')}
      </Modal>

      <Modal
        abierto={dialogo === 'marcar_enviada'}
        titulo="Marcar como enviada"
        descripcion="El comprador verá el número de guía junto al botón para rastrear el envío."
        alCerrar={cerrar}
      >
        <form
          className="pedido-modal-formulario"
          onSubmit={(e) => {
            e.preventDefault()
            void ejecutar('marcar_enviada', { numero_guia: guia.trim() })
          }}
        >
          {errorEn('marcar_enviada')}
          <Campo etiqueta="Número de guía">
            {(atributos) => (
              <input
                {...atributos}
                required
                disabled={pendiente}
                maxLength={60}
                value={guia}
                onChange={(e) => setGuia(e.target.value)}
              />
            )}
          </Campo>
          <div className="modal-acciones pedido-modal-acciones">
            <Boton variante="secundario" onClick={cerrar}>
              Volver
            </Boton>
            <Boton type="submit" icono="envio" disabled={!guia.trim()} cargando={pendiente}>
              Marcar enviada
            </Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={dialogo === 'rechazar_orden'}
        titulo="¿Rechazar este pedido?"
        descripcion="El comprador verá que no puedes atenderlo. No se puede deshacer."
        alCerrar={cerrar}
        acciones={
          <>
            <Boton variante="secundario" onClick={cerrar}>
              Volver
            </Boton>
            <Boton
              variante="peligro"
              icono="cerrar"
              cargando={pendiente}
              onClick={() => void ejecutar('rechazar_orden')}
            >
              Rechazar pedido
            </Boton>
          </>
        }
      >
        {errorEn('rechazar_orden')}
      </Modal>

      <Modal
        abierto={dialogo === 'cancelar_orden'}
        titulo="¿Cancelar este pedido?"
        descripcion="El pedido queda cancelado para las dos partes. No se puede deshacer."
        alCerrar={cerrar}
        acciones={
          <>
            <Boton variante="secundario" onClick={cerrar}>
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
        {errorEn('cancelar_orden')}
      </Modal>
      <Modal
        abierto={dialogo === 'marcar_lista_recojo' || dialogo === 'marcar_entregada'}
        titulo={
          dialogo === 'marcar_lista_recojo'
            ? '¿La pieza está lista para recojo?'
            : '¿Entregaste este pedido?'
        }
        alCerrar={cerrar}
        ocupado={pendiente}
        acciones={
          <>
            <Boton variante="secundario" disabled={pendiente} onClick={cerrar}>
              Volver
            </Boton>
            <Boton
              variante="destacado"
              cargando={pendiente}
              onClick={() => {
                if (dialogo === 'marcar_lista_recojo' || dialogo === 'marcar_entregada')
                  void ejecutar(dialogo)
              }}
            >
              Confirmar
            </Boton>
          </>
        }
      >
        <p>El cambio se mostrará a las dos partes del pedido.</p>
        {error && <Aviso tono="error">{error}</Aviso>}
      </Modal>
    </section>
  )
}
