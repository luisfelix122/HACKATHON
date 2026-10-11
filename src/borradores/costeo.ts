import type { Costeo, Disponibilidad } from '../compartido/dominio/producto'

export const MENSAJES_COSTEO = {
  pierdeDinero: 'Con este precio pierdes dinero',
  precioMayorCero: 'El precio final debe ser mayor a 0',
  valoresPositivos: 'Los valores del costeo no pueden ser negativos',
  plazoRequerido: 'Para productos a pedido, el plazo en días debe ser mayor a 0',
  descripcionExcedida: 'La descripción no puede superar los 2000 caracteres',
} as const

/**
 * Redondeo estándar a 2 decimales en soles (PEN), manejando precisión flotante (.005 redondea hacia arriba).
 */
export function redondearCentavos(monto: number): number {
  return Math.round((monto + Number.EPSILON) * 100) / 100
}

/**
 * costo = materiales + horas * pago_por_hora + gastos.
 * El cálculo se redondea al final para evitar errores acumulados de coma flotante.
 */
export function calcularCosto(costeo: Partial<Costeo>): number {
  const materiales = Math.max(0, costeo.materiales ?? 0)
  const horas = Math.max(0, costeo.horas ?? 0)
  const pagoHora = Math.max(0, costeo.pago_hora ?? 0)
  const gastos = Math.max(0, costeo.gastos ?? 0)
  const total = materiales + horas * pagoHora + gastos
  return redondearCentavos(total)
}

/**
 * precio_sugerido = materiales + horas * pago_por_hora + gastos + ganancia.
 * Se calcula en el cliente y no se guarda en la base de datos (3FN, CC-09).
 */
export function calcularPrecioSugerido(costeo: Partial<Costeo>): number {
  const materiales = Math.max(0, costeo.materiales ?? 0)
  const horas = Math.max(0, costeo.horas ?? 0)
  const pagoHora = Math.max(0, costeo.pago_hora ?? 0)
  const gastos = Math.max(0, costeo.gastos ?? 0)
  const ganancia = Math.max(0, costeo.ganancia ?? 0)
  const total = materiales + horas * pagoHora + gastos + ganancia
  return redondearCentavos(total)
}

/**
 * Comprueba si el precio final fijado por el artesano es menor al costo total de producción.
 */
export function esPrecioMenorQueCosto(precioFinal: number, costo: number): boolean {
  return precioFinal < costo
}

/**
 * Valida que los valores del costeo no sean negativos ni NaN.
 */
export function validarCosteo(costeo: Partial<Costeo>): { valido: boolean; error?: string } {
  const campos: (keyof Costeo)[] = ['materiales', 'horas', 'pago_hora', 'gastos', 'ganancia']
  for (const campo of campos) {
    const val = costeo[campo]
    if (val !== undefined && val !== null) {
      if (Number.isNaN(val) || val < 0) {
        return { valido: false, error: MENSAJES_COSTEO.valoresPositivos }
      }
    }
  }
  return { valido: true }
}

/**
 * Valida que el precio final sea un número positivo > 0.
 */
export function validarPrecioFinal(precioFinal: number): { valido: boolean; error?: string } {
  if (typeof precioFinal !== 'number' || Number.isNaN(precioFinal) || precioFinal <= 0) {
    return { valido: false, error: MENSAJES_COSTEO.precioMayorCero }
  }
  return { valido: true }
}

/**
 * Valida la disponibilidad según las reglas del contrato (CC-09):
 * - en_stock: no exige cantidad ni plazo.
 * - a_pedido: exige un plazo en días entero > 0.
 */
export function validarDisponibilidad(
  disponibilidad: Disponibilidad,
  plazoDias?: number | null,
): { valido: boolean; error?: string } {
  if (disponibilidad === 'a_pedido') {
    if (!plazoDias || plazoDias <= 0 || !Number.isInteger(plazoDias)) {
      return { valido: false, error: MENSAJES_COSTEO.plazoRequerido }
    }
  }
  return { valido: true }
}
