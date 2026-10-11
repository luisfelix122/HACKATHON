import { describe, expect, it } from 'vitest'
import { validarContrasena, validarPerfil } from './perfil'

describe('validaciones del registro', () => {
  const datos = {
    nombre: 'Artesano',
    whatsapp: '+51912345678',
    lugar: 'Lobitos',
    rna_numero: 'RNA',
    asociacion: '',
    historia: '',
  }
  it('acepta un perfil completo', () => expect(validarPerfil(datos).lugar).toBe('Lobitos'))
  it.each([
    { whatsapp: '912345678' },
    { lugar: 'Lima' },
    { rna_numero: ' ' },
    { nombre: ' ' },
    { historia: 'x'.repeat(601) },
  ])('rechaza datos inválidos %o', (cambio) =>
    expect(() => validarPerfil({ ...datos, ...cambio })).toThrow(),
  )
  it('rechaza contraseña corta o distinta', () => {
    expect(() => validarContrasena('1234567', '1234567')).toThrow()
    expect(() => validarContrasena('12345678', '87654321')).toThrow()
    expect(() => validarContrasena('12345678', '12345678')).not.toThrow()
  })
})
