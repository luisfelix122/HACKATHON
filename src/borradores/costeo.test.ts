import { describe, expect, it } from 'vitest'
import {
  calcularCosto,
  calcularPrecioSugerido,
  esPrecioMenorQueCosto,
  validarCosteo,
  validarPrecioFinal,
  validarDisponibilidad,
  redondearCentavos,
  MENSAJES_COSTEO,
} from './costeo'

describe('costeo y calculadora de precios (PRP 002)', () => {
  describe('cálculo del costo y precio sugerido', () => {
    it('caso feliz: calcula costo y precio sugerido sumando ganancia', () => {
      const costeo = {
        materiales: 15,
        horas: 4,
        pago_hora: 10,
        gastos: 5,
        ganancia: 20,
      }
      // costo = 15 + (4 * 10) + 5 = 60
      expect(calcularCosto(costeo)).toBe(60)
      // precio sugerido = 60 + 20 = 80
      expect(calcularPrecioSugerido(costeo)).toBe(80)
    })

    it('maneja valores decimales y redondeo de .005', () => {
      // 10.005 debe redondear a 10.01
      expect(redondearCentavos(10.005)).toBe(10.01)
      expect(redondearCentavos(10.004)).toBe(10.0)

      const costeo = {
        materiales: 12.355,
        horas: 1.5,
        pago_hora: 8.5, // 1.5 * 8.5 = 12.75
        gastos: 2.1,
        ganancia: 5.25,
      }
      // total costo sin redondear antes = 12.355 + 12.75 + 2.1 = 27.205 -> 27.21
      expect(calcularCosto(costeo)).toBe(27.21)
      // total sugerido = 27.205 + 5.25 = 32.455 -> 32.46
      expect(calcularPrecioSugerido(costeo)).toBe(32.46)
    })

    it('maneja campos vacíos o ausentes tratándolos como cero', () => {
      expect(calcularCosto({})).toBe(0)
      expect(calcularPrecioSugerido({})).toBe(0)
      expect(calcularCosto({ materiales: 25 })).toBe(25)
    })
  })

  describe('detección de pérdida', () => {
    it('detecta si el precio final es menor que el costo', () => {
      const costo = 60
      expect(esPrecioMenorQueCosto(50, costo)).toBe(true)
      expect(esPrecioMenorQueCosto(60, costo)).toBe(false)
      expect(esPrecioMenorQueCosto(65, costo)).toBe(false)
    })
  })

  describe('validaciones', () => {
    it('rechaza valores de costeo negativos', () => {
      const res = validarCosteo({ materiales: -5, horas: 2, pago_hora: 10, gastos: 0, ganancia: 0 })
      expect(res.valido).toBe(false)
      expect(res.error).toBe(MENSAJES_COSTEO.valoresPositivos)
    })

    it('acepta costeo con valores válidos mayores o iguales a 0', () => {
      const res = validarCosteo({ materiales: 10, horas: 2, pago_hora: 10, gastos: 0, ganancia: 5 })
      expect(res.valido).toBe(true)
      expect(res.error).toBeUndefined()
    })

    it('valida que el precio final sea > 0', () => {
      expect(validarPrecioFinal(0).valido).toBe(false)
      expect(validarPrecioFinal(-10).valido).toBe(false)
      expect(validarPrecioFinal(NaN).valido).toBe(false)
      expect(validarPrecioFinal(0.01).valido).toBe(true)
      expect(validarPrecioFinal(50).valido).toBe(true)
    })

    it('valida disponibilidad: en_stock no pide plazo, a_pedido exige plazo en días > 0', () => {
      expect(validarDisponibilidad('en_stock').valido).toBe(true)
      expect(validarDisponibilidad('en_stock', null).valido).toBe(true)

      const invalidoSinPlazo = validarDisponibilidad('a_pedido', null)
      expect(invalidoSinPlazo.valido).toBe(false)
      expect(invalidoSinPlazo.error).toBe(MENSAJES_COSTEO.plazoRequerido)

      const invalidoCero = validarDisponibilidad('a_pedido', 0)
      expect(invalidoCero.valido).toBe(false)

      const invalidoNegativo = validarDisponibilidad('a_pedido', -2)
      expect(invalidoNegativo.valido).toBe(false)

      const valido = validarDisponibilidad('a_pedido', 5)
      expect(valido.valido).toBe(true)
    })
  })
})
