import { describe, expect, it } from 'vitest'
import { extensionQr, validarMetodoPago, type BorradorMetodoPago } from './metodosPago'

const base: BorradorMetodoPago = {
  tipo: 'yape',
  titular: ' María Juárez ',
  numero: '900 000 001',
  banco: '',
  cci: '',
}

describe('validarMetodoPago', () => {
  it('acepta un celular peruano de 9 dígitos para Yape o Plin y limpia los espacios', () => {
    const res = validarMetodoPago(base)
    expect(res.errores).toEqual({})
    expect(res.datos).toEqual({
      tipo: 'yape',
      titular: 'María Juárez',
      numero: '900000001',
      banco: null,
      cci: null,
    })
  })

  it('rechaza un celular que no empieza con 9 o no tiene 9 dígitos', () => {
    expect(validarMetodoPago({ ...base, numero: '800000001' }).errores.numero).toBeDefined()
    expect(
      validarMetodoPago({ ...base, tipo: 'plin', numero: '9000' }).errores.numero,
    ).toBeDefined()
  })

  it('exige el banco en una cuenta bancaria y acepta un CCI de 20 dígitos', () => {
    const cuenta = { ...base, tipo: 'cuenta_bancaria' as const, numero: '191-0000000-0-01' }
    expect(validarMetodoPago(cuenta).errores.banco).toBeDefined()
    const res = validarMetodoPago({ ...cuenta, banco: 'BCP', cci: '0021 9100 0000 0000 0101' })
    expect(res.errores).toEqual({})
    expect(res.datos).toMatchObject({
      numero: '191-0000000-0-01',
      banco: 'BCP',
      cci: '00219100000000000101',
    })
  })

  it('rechaza un CCI que no tiene 20 dígitos', () => {
    const cuenta = {
      ...base,
      tipo: 'cuenta_bancaria' as const,
      numero: '191-0000000-0-01',
      banco: 'BCP',
    }
    expect(validarMetodoPago({ ...cuenta, cci: '123' }).errores.cci).toBeDefined()
  })

  it('exige el titular', () => {
    expect(validarMetodoPago({ ...base, titular: '  ' }).errores.titular).toBeDefined()
  })
})

describe('extensionQr', () => {
  it('acepta PNG, JPG y WebP de hasta 1 MB', () => {
    expect(extensionQr({ type: 'image/png', size: 2000 })).toBe('png')
    expect(extensionQr({ type: 'image/jpeg', size: 2000 })).toBe('jpg')
    expect(extensionQr({ type: 'image/webp', size: 2000 })).toBe('webp')
  })

  it('rechaza otros formatos o archivos de más de 1 MB', () => {
    expect(extensionQr({ type: 'image/svg+xml', size: 2000 })).toBeNull()
    expect(extensionQr({ type: 'image/png', size: 2 * 1024 * 1024 })).toBeNull()
  })
})
