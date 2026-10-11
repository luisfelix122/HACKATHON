import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { leerPerfil, validarContrasena, validarPerfil } from './perfil'

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

describe('regresión de acreditación real', () => {
  it('mantiene pendiente aunque el RNA coincida con una demo anterior', async () => {
    const real = {
      id: 'cuenta',
      rol: 'artesano',
      rna_numero: 'RNA-2026-001',
      acreditacion: 'pendiente',
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: real, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const cliente = {
      from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }),
    } as unknown as SupabaseClient
    expect(await leerPerfil('cuenta', cliente)).toEqual(real)
  })
})
