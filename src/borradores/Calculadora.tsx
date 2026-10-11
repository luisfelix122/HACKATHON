import type { Costeo } from '../compartido/dominio/producto'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import {
  calcularCosto,
  calcularPrecioSugerido,
  esPrecioMenorQueCosto,
  MENSAJES_COSTEO,
  validarPrecioFinal,
} from './costeo'

export interface CalculadoraProps {
  costeo: Partial<Costeo>
  precioFinal: number | ''
  alCambiarCosteo: (costeo: Partial<Costeo>) => void
  alCambiarPrecioFinal: (precio: number) => void
}

export function Calculadora({
  costeo,
  precioFinal,
  alCambiarCosteo,
  alCambiarPrecioFinal,
}: CalculadoraProps) {
  const costo = calcularCosto(costeo)
  const precioSugerido = calcularPrecioSugerido(costeo)
  const numPrecioFinal = typeof precioFinal === 'number' ? precioFinal : 0
  const tienePerdida = numPrecioFinal > 0 && esPrecioMenorQueCosto(numPrecioFinal, costo)
  const precioFinalValido = validarPrecioFinal(numPrecioFinal)

  const manejarCambio = (campo: keyof Costeo, valorString: string) => {
    const val = valorString === '' ? 0 : parseFloat(valorString)
    alCambiarCosteo({
      ...costeo,
      [campo]: Number.isNaN(val) ? 0 : Math.max(0, val),
    })
  }

  return (
    <div className="calculadora-contenedor">
      <h2 className="calculadora-titulo">Calculadora de costos y precio</h2>
      <p className="texto-ayuda">
        Anota lo que gastaste y el tiempo que te tomó para calcular un precio justo que valore tu
        trabajo.
      </p>

      <div className="calculadora-campos">
        <Campo
          etiqueta="Materiales (hilos, arcilla, tintes) — S/"
          ayuda="¿Cuánto gastaste en los materiales para esta pieza?"
        >
          {(attrs) => (
            <input
              {...attrs}
              type="number"
              step="0.5"
              min="0"
              className="control control-grande"
              placeholder="0.00"
              value={costeo.materiales || ''}
              onChange={(e) => manejarCambio('materiales', e.target.value)}
            />
          )}
        </Campo>

        <div className="fila-dos-columnas">
          <Campo etiqueta="Horas dedicadas" ayuda="Tiempo trabajado">
            {(attrs) => (
              <input
                {...attrs}
                type="number"
                step="0.5"
                min="0"
                className="control control-grande"
                placeholder="0"
                value={costeo.horas || ''}
                onChange={(e) => manejarCambio('horas', e.target.value)}
              />
            )}
          </Campo>

          <Campo etiqueta="Tu pago por hora — S/" ayuda="Valor de tu hora">
            {(attrs) => (
              <input
                {...attrs}
                type="number"
                step="1"
                min="0"
                className="control control-grande"
                placeholder="0.00"
                value={costeo.pago_hora || ''}
                onChange={(e) => manejarCambio('pago_hora', e.target.value)}
              />
            )}
          </Campo>
        </div>

        <div className="fila-dos-columnas">
          <Campo etiqueta="Otros gastos (luz, movilidad) — S/">
            {(attrs) => (
              <input
                {...attrs}
                type="number"
                step="0.5"
                min="0"
                className="control control-grande"
                placeholder="0.00"
                value={costeo.gastos || ''}
                onChange={(e) => manejarCambio('gastos', e.target.value)}
              />
            )}
          </Campo>

          <Campo etiqueta="Ganancia esperada — S/">
            {(attrs) => (
              <input
                {...attrs}
                type="number"
                step="1"
                min="0"
                className="control control-grande"
                placeholder="0.00"
                value={costeo.ganancia || ''}
                onChange={(e) => manejarCambio('ganancia', e.target.value)}
              />
            )}
          </Campo>
        </div>
      </div>

      <div className="resumen-costeo panel">
        <div className="resumen-fila">
          <span>Costo total de producción:</span>
          <strong>S/ {costo.toFixed(2)}</strong>
        </div>
        <div className="resumen-fila destacada">
          <span>Precio sugerido (con ganancia):</span>
          <strong className="monto-sugerido">S/ {precioSugerido.toFixed(2)}</strong>
        </div>
        {precioSugerido > 0 && (
          <Boton
            type="button"
            variante="secundario"
            onClick={() => alCambiarPrecioFinal(precioSugerido)}
          >
            Usar precio sugerido
          </Boton>
        )}
      </div>

      <div className="precio-final-bloque">
        <Campo
          etiqueta="Precio final de venta — S/*"
          ayuda="Este es el precio que verá el comprador en la tienda"
          error={
            !precioFinalValido.valido && numPrecioFinal > 0 ? precioFinalValido.error : undefined
          }
        >
          {(attrs) => (
            <input
              {...attrs}
              type="number"
              step="0.5"
              min="0.1"
              className="control control-gigante"
              placeholder="0.00"
              value={precioFinal === '' ? '' : precioFinal}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                alCambiarPrecioFinal(Number.isNaN(val) ? 0 : val)
              }}
            />
          )}
        </Campo>

        {tienePerdida && <Aviso tono="alerta">{MENSAJES_COSTEO.pierdeDinero}</Aviso>}
      </div>
    </div>
  )
}
