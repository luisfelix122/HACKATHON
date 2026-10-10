import { describe, expect, it, vi } from 'vitest'

vi.mock('../compartido/supabase', () => ({ supabase: {} }))

const { validarContrasena, validarDatosArtesano } = await import('./perfil')

const valido = {
  nombre: 'Rosa',
  whatsapp: '+51987654321',
  lugar: 'Lobitos',
  asociacion: '',
  historia: '',
  rna_numero: 'RNA-123',
}

describe('validarDatosArtesano', () => {
  it('acepta un perfil completo', () => {
    expect(validarDatosArtesano(valido)).toEqual({})
  })

  it('exige WhatsApp con código de país', () => {
    expect(validarDatosArtesano({ ...valido, whatsapp: '987654321' }).whatsapp).toBeDefined()
  })

  it('rechaza un lugar fuera de la lista', () => {
    expect(validarDatosArtesano({ ...valido, lugar: 'Lima' }).lugar).toBeDefined()
  })

  it('exige el número de RNA', () => {
    expect(validarDatosArtesano({ ...valido, rna_numero: '  ' }).rna_numero).toBeDefined()
  })

  it('limita la historia a 600 caracteres', () => {
    expect(validarDatosArtesano({ ...valido, historia: 'a'.repeat(601) }).historia).toBeDefined()
  })
})

describe('validarContrasena', () => {
  it('acepta 8 o más caracteres iguales a la confirmación', () => {
    expect(validarContrasena('arena2026', 'arena2026')).toBeNull()
  })

  it('rechaza contraseñas cortas', () => {
    expect(validarContrasena('corta', 'corta')).toMatch(/al menos 8/)
  })

  it('rechaza si no coincide la confirmación', () => {
    expect(validarContrasena('arena2026', 'arena2025')).toMatch(/no coinciden/)
  })
})
