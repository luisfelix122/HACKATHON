import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import {
  ErrorSesion,
  asegurarPerfilComprador,
  cerrarSesion,
  iniciarSesionGoogle,
  rutaSegura,
  suscribirSesion,
} from './sesion'

type Respuesta = { data: unknown; error: { message: string; code?: string } | null }

/** Cliente simulado: solo lo que usa sesion.ts. */
function clienteFalso(opciones: { lecturas?: Respuesta[]; alta?: Respuesta } = {}) {
  const lecturas = [...(opciones.lecturas ?? [{ data: null, error: null }])]
  const insert = vi.fn(() => ({
    select: () => ({ single: () => Promise.resolve(opciones.alta ?? { data: null, error: null }) }),
  }))
  const leer = vi.fn(() => Promise.resolve(lecturas.shift() ?? { data: null, error: null }))
  const unsubscribe = vi.fn()
  const auth = {
    signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe } } })),
  }
  const cliente = {
    auth,
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: leer }) }), insert })),
  }
  return { cliente: cliente as unknown as SupabaseClient, insert, leer, auth, unsubscribe }
}

const usuario = (extra: Partial<User> = {}) =>
  ({ id: 'u-1', email: 'camila@correo.test', user_metadata: {}, ...extra }) as User

const perfilComprador = { id: 'u-1', rol: 'comprador', nombre: 'Camila' }

describe('asegurarPerfilComprador', () => {
  it('si el perfil ya existe lo devuelve y no inserta', async () => {
    const { cliente, insert } = clienteFalso({ lecturas: [{ data: perfilComprador, error: null }] })
    await expect(asegurarPerfilComprador(usuario(), cliente)).resolves.toEqual(perfilComprador)
    expect(insert).not.toHaveBeenCalled()
  })

  it('en el primer ingreso inserta una sola vez el perfil comprador con el nombre de Google', async () => {
    const { cliente, insert } = clienteFalso({ alta: { data: perfilComprador, error: null } })
    const perfil = await asegurarPerfilComprador(
      usuario({ user_metadata: { full_name: 'Camila Turista' } }),
      cliente,
    )
    expect(perfil).toEqual(perfilComprador)
    expect(insert).toHaveBeenCalledTimes(1)
    expect(insert).toHaveBeenCalledWith({ id: 'u-1', rol: 'comprador', nombre: 'Camila Turista' })
  })

  it('sin nombre en Google usa la parte local del correo', async () => {
    const { cliente, insert } = clienteFalso({ alta: { data: perfilComprador, error: null } })
    await asegurarPerfilComprador(usuario(), cliente)
    expect(insert).toHaveBeenCalledWith({ id: 'u-1', rol: 'comprador', nombre: 'camila' })
  })

  it('si otra pestaña lo creó a la vez (23505), lee el perfil existente', async () => {
    const { cliente, leer } = clienteFalso({
      lecturas: [
        { data: null, error: null },
        { data: perfilComprador, error: null },
      ],
      alta: { data: null, error: { message: 'duplicate key', code: '23505' } },
    })
    await expect(asegurarPerfilComprador(usuario(), cliente)).resolves.toEqual(perfilComprador)
    expect(leer).toHaveBeenCalledTimes(2)
  })

  it('con error de red lanza un ErrorSesion con un mensaje legible', async () => {
    const { cliente, insert } = clienteFalso({
      lecturas: [{ data: null, error: { message: 'TypeError: Failed to fetch' } }],
    })
    const intento = asegurarPerfilComprador(usuario(), cliente)
    await expect(intento).rejects.toBeInstanceOf(ErrorSesion)
    await expect(intento).rejects.toThrow('No pudimos conectar. Revisa tu conexión y reintenta.')
    expect(insert).not.toHaveBeenCalled()
  })
})

describe('iniciarSesionGoogle', () => {
  it('vuelve a la ruta de origen dentro de la web', async () => {
    const { cliente, auth } = clienteFalso()
    await iniciarSesionGoogle('/producto/x', cliente)
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/producto/x` },
    })
  })

  it('con un error de Supabase lanza un ErrorSesion', async () => {
    const { cliente, auth } = clienteFalso()
    auth.signInWithOAuth.mockResolvedValueOnce({
      data: {},
      error: { message: 'Failed to fetch' },
    } as never)
    await expect(iniciarSesionGoogle('/', cliente)).rejects.toBeInstanceOf(ErrorSesion)
  })
})

describe('rutaSegura', () => {
  it.each([
    ['/producto/x?talla=m', '/producto/x?talla=m'],
    ['/admin', '/admin'],
    ['//sitio-ajeno.test', '/'],
    ['/\\sitio-ajeno.test', '/'],
    ['https://sitio-ajeno.test', '/'],
    ['producto/x', '/'],
    ['', '/'],
    [null, '/'],
  ])('%s → %s (no permite redirigir fuera de la web)', (entrada, esperado) => {
    expect(rutaSegura(entrada)).toBe(esperado)
  })
})

describe('sesión', () => {
  it('cerrarSesion cierra la sesión en Supabase', async () => {
    const { cliente, auth } = clienteFalso()
    await cerrarSesion(cliente)
    expect(auth.signOut).toHaveBeenCalled()
  })

  it('suscribirSesion devuelve una función que cancela la suscripción', () => {
    const { cliente, unsubscribe } = clienteFalso()
    const cancelar = suscribirSesion(() => {}, cliente)
    cancelar()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
