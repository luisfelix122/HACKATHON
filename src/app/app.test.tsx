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
  it('la web abre en la portada con la ruta de las caletas', () => {
    render(<AppWeb />)
    expect(
      screen.getByRole('heading', { level: 1, name: /Piezas hechas a mano/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Caletas de norte a sur' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aylly, inicio' })).toBeInTheDocument()
  })

  it('la APK sin sesión pide correo y contraseña (CC-03)', async () => {
    render(<AppArtesano />)
    expect(await screen.findByLabelText('Tu correo de Google')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })
})
