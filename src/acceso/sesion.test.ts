import { beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithPassword = vi.fn()
const signOut = vi.fn().mockResolvedValue({ error: null })
let perfilDevuelto: { rol: string } | null = null

vi.mock('../compartido/supabase', () => ({
  CLAVE_SESION: 'ayllu.auth',
  supabase: {
    auth: { signInWithPassword, signOut },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: perfilDevuelto, error: null }) }),
      }),
    }),
  },
}))

const { ingresarArtesano } = await import('./sesion')

const ok = { data: { user: { id: 'u1' } }, error: null }

describe('ingresarArtesano (CC-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    perfilDevuelto = null
  })

  it('deja entrar a un artesano', async () => {
    signInWithPassword.mockResolvedValue(ok)
    perfilDevuelto = { rol: 'artesano' }
    expect(await ingresarArtesano('rosa@gmail.com', 'arena2026')).toBeNull()
    expect(signOut).not.toHaveBeenCalled()
  })

  it('rechaza credenciales inválidas sin decir cuál dato falla', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: 'invalid_credentials', status: 400 },
    })
    expect(await ingresarArtesano('x@gmail.com', 'malaclave')).toBe('credenciales_invalidas')
  })

  it('cierra la sesión de un comprador', async () => {
    signInWithPassword.mockResolvedValue(ok)
    perfilDevuelto = { rol: 'comprador' }
    expect(await ingresarArtesano('c@gmail.com', 'arena2026')).toBe('rol_incorrecto')
    expect(signOut).toHaveBeenCalled()
  })

  it('cierra la sesión si el registro de artesano no se completó', async () => {
    signInWithPassword.mockResolvedValue(ok)
    perfilDevuelto = null
    expect(await ingresarArtesano('n@gmail.com', 'arena2026')).toBe('sin_registro')
    expect(signOut).toHaveBeenCalled()
  })
})
