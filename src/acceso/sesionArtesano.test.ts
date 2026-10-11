import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ingresarArtesano, registrarCorreo } from './sesionArtesano'

function cliente(rol: string | null = 'artesano', error: unknown = null) {
  const signOut = vi.fn().mockResolvedValue({ error: null })
  const auth = {
    signOut,
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: 'usuario' } }, error }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: { identities: [{}] }, session: { user: { id: 'usuario' } } },
      error,
    }),
  }
  return {
    auth,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: rol ? { rol } : null, error: null }) }),
      }),
    }),
  }
}
describe('sesión artesano', () => {
  it('permite artesano y distingue registro incompleto', async () => {
    expect(
      await ingresarArtesano('correo@test.test', 'clave', cliente() as unknown as SupabaseClient),
    ).toEqual({ rol: 'artesano' })
    expect(
      await ingresarArtesano(
        'correo@test.test',
        'clave',
        cliente(null) as unknown as SupabaseClient,
      ),
    ).toBeNull()
  })
  it('cierra la sesión de un comprador', async () => {
    const c = cliente('comprador')
    await expect(
      ingresarArtesano('correo@test.test', 'clave', c as unknown as SupabaseClient),
    ).rejects.toThrow('Esta cuenta es de comprador')
    expect(c.auth.signOut).toHaveBeenCalled()
  })
  it('no revela qué credencial falla', async () => {
    await expect(
      ingresarArtesano('correo@test.test', 'clave', cliente(null, {}) as unknown as SupabaseClient),
    ).rejects.toThrow('Correo o contraseña incorrectos')
  })
  it('registra con sesión y detecta correo repetido', async () => {
    await expect(
      registrarCorreo(
        'correo@test.test',
        '12345678',
        '12345678',
        cliente() as unknown as SupabaseClient,
      ),
    ).resolves.toBeTruthy()
    await expect(
      registrarCorreo(
        'correo@test.test',
        '12345678',
        '12345678',
        cliente(null, { code: 'user_already_exists' }) as unknown as SupabaseClient,
      ),
    ).rejects.toThrow('Ese correo ya tiene cuenta')
  })
})
