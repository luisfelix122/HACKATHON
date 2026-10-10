import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Sin sesión guardada: el cliente real de Supabase no se usa en estas pruebas.
vi.mock('../compartido/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}))

const { AppWeb } = await import('./AppWeb')
const { AppArtesano } = await import('./AppArtesano')

describe('salidas de la app', () => {
  it('la web muestra la vitrina en la ruta raíz', () => {
    render(<AppWeb />)
    expect(screen.getByRole('heading', { name: 'CosteARTE' })).toBeInTheDocument()
  })

  it('la APK sin sesión pide correo y contraseña (CC-03)', async () => {
    render(<AppArtesano />)
    expect(await screen.findByLabelText('Tu correo de Google')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })
})
