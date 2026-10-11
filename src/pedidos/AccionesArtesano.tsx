import { useState } from 'react'
import type { Orden } from '../compartido/dominio/orden'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { accionesVisibles, avisoCarga } from './estadoOrden'
import { enlaceHttps, useAccionOrden, type ContextoAcciones } from './acciones'
import { estimarEntrega, hoyLima } from './estimarEntrega'
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
  return (
    <section className="pedido-acuerdo" aria-label="Acciones del artesano">
      <h2>Siguiente paso</h2>
      {error && <Aviso tono="error">{error}</Aviso>}
      {acciones.includes('aceptar_orden') && (
        <form
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
          <fieldset disabled={pendiente}>
            <legend>Cotización y entrega</legend>
            {orden.modalidad === 'envio' && (
              <Campo etiqueta="Costo de envío (S/)">
                {(atributos) => (
                  <input
                    {...atributos}
                    type="number"
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
            <Boton type="submit" cargando={pendiente}>
              Aceptar pedido
            </Boton>
          </fieldset>
        </form>
      )}
      {acciones.includes('rechazar_orden') && (
        <Boton
          variante="secundario"
          cargando={pendiente}
          onClick={() => void ejecutar('rechazar_orden')}
        >
          Rechazar pedido
        </Boton>
      )}
      {acciones.includes('enviar_enlace_pago') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (enlaceHttps(enlace)) void ejecutar('enviar_enlace_pago', { enlace_pago: enlace })
          }}
        >
          <Campo etiqueta="Enlace de pago" ayuda="Debe comenzar con https://.">
            {(atributos) => (
              <input
                {...atributos}
                type="url"
                pattern="https://.*"
                required
                disabled={pendiente}
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
              />
            )}
          </Campo>
          <Boton type="submit" disabled={!enlaceHttps(enlace)} cargando={pendiente}>
            Enviar enlace de pago
          </Boton>
        </form>
      )}
      {acciones.includes('verificar_abono') && (
        <>
          <p>Comprueba el abono en tu cuenta antes de marcarlo como pagado.</p>
          <Boton cargando={pendiente} onClick={() => void ejecutar('verificar_abono')}>
            Verificar abono
          </Boton>
        </>
      )}
      {acciones.includes('marcar_enviada') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void ejecutar('marcar_enviada', { numero_guia: guia.trim() })
          }}
        >
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
          <Boton type="submit" disabled={!guia.trim()} cargando={pendiente}>
            Marcar enviada
          </Boton>
        </form>
      )}
      {acciones.includes('marcar_lista_recojo') && (
        <Boton cargando={pendiente} onClick={() => void ejecutar('marcar_lista_recojo')}>
          Lista para recojo
        </Boton>
      )}
      {acciones.includes('marcar_entregada') && (
        <Boton cargando={pendiente} onClick={() => void ejecutar('marcar_entregada')}>
          Marcar entregada
        </Boton>
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
