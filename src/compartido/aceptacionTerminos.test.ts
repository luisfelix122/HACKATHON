import { beforeEach, describe, expect, it } from 'vitest'
import { aceptarTerminos, consultarAceptacion, VERSION_TERMINOS } from './aceptacionTerminos'

describe('aceptación de términos local por cuenta', () => {
  beforeEach(() => localStorage.clear())
  it('requiere aceptación explícita y no confunde cuentas', () => {
    expect(consultarAceptacion('cuenta-a')).toBeNull()
    aceptarTerminos('cuenta-a')
    expect(consultarAceptacion('cuenta-a')?.version).toBe(VERSION_TERMINOS)
    expect(consultarAceptacion('cuenta-b')).toBeNull()
  })
  it('no acepta identidad vacía ni versiones anteriores', () => {
    expect(() => aceptarTerminos('')).toThrow()
    localStorage.setItem(
      'ayllu:terminos:cuenta-a',
      JSON.stringify({ version: 'anterior', aceptadoEn: new Date().toISOString() }),
    )
    expect(consultarAceptacion('cuenta-a')).toBeNull()
  })
  it('rechaza almacenamiento corrupto sin afirmar consentimiento', () => {
    localStorage.setItem('ayllu:terminos:cuenta-a', 'invalido')
    expect(consultarAceptacion('cuenta-a')).toBeNull()
  })
})
