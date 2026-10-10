import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Sesión y perfil configurables por prueba; el cliente real de Supabase no se usa.
let sesion: { user: { id: string; email: string; user_metadata: object } } | null = null
let perfil: { rol: string; nombre: string; acreditacion: string | null } | null = null
const signOut = vi.fn().mockResolvedValue({ error: null })

vi.mock('../compartido/supabase', () => ({
  CLAVE_SESION: 'ayllu.auth',
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: sesion }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut,
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: perfil, error: null }) }),
      }),
    }),
  },
}))
vi.mock('@capacitor/app', () => ({
  App: { addListener: () => Promise.resolve({ remove: () => Promise.resolve() }) },
}))
vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn(), close: vi.fn() } }))

const { AppWeb } = await import('./AppWeb')
const { AppArtesano } = await import('./AppArtesano')

beforeEach(() => {
  sesion = null
  perfil = null
  signOut.mockClear()
})

describe('web', () => {
  it('abre en la portada con la ruta de las caletas', () => {
    render(<AppWeb />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Piezas hechas a mano/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Caletas de norte a sur' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ayllu, inicio' })).toBeInTheDocument()
  })
})

describe('APK del artesano (CC-06)', () => {
  it('sin sesión ofrece ingresar con contraseña o crear la cuenta con Google', async () => {
    render(<AppArtesano />)
    expect(await screen.findByLabelText('Tu correo de Google')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear mi cuenta con Google' })).toBeInTheDocument()
  })

  it('con sesión de Google y sin perfil muestra el registro, no «Mis productos»', async () => {
    sesion = { user: { id: 'u1', email: 'rosa@gmail.com', user_metadata: {} } }
    render(<AppArtesano />)
    expect(await screen.findByRole('heading', { name: 'Tu guía de artesano' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mis productos' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Usar otra cuenta de Google' })).toBeInTheDocument()
  })

  it('con perfil de comprador cierra la sesión', async () => {
    sesion = { user: { id: 'u2', email: 'c@gmail.com', user_metadata: {} } }
    perfil = { rol: 'comprador', nombre: 'C', acreditacion: null }
    render(<AppArtesano />)
    await vi.waitFor(() => expect(signOut).toHaveBeenCalled())
  })

  it('con perfil de artesano muestra «Mis productos»', async () => {
    sesion = { user: { id: 'u3', email: 'r@gmail.com', user_metadata: {} } }
    perfil = { rol: 'artesano', nombre: 'Rosa', acreditacion: 'pendiente' }
    render(<AppArtesano />)
    expect(await screen.findByRole('heading', { name: 'Mis productos' })).toBeInTheDocument()
  })
})
