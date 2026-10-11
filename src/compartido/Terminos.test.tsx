import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Terminos } from './Terminos'
const usuario = vi.hoisted(() => ({ id: 'cuenta-a' as string | null }))
vi.mock('./sesion', () => ({
  useSesion: () => ({ sesion: usuario.id ? { user: { id: usuario.id } } : null }),
}))
beforeEach(() => {
  usuario.id = 'cuenta-a'
  localStorage.clear()
})
afterEach(cleanup)
describe('términos compartidos', () => {
  it('pueden leerse sin sesión y no aceptan automáticamente', () => {
    usuario.id = null
    render(
      <MemoryRouter>
        <Terminos />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Términos y condiciones' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Registrar aceptación local' }),
    ).not.toBeInTheDocument()
  })
  it('requieren confirmación explícita y no arrastran la aceptación al cambiar cuenta', () => {
    const vista = render(
      <MemoryRouter>
        <Terminos />
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Registrar aceptación local' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Registrar aceptación local' }))
    expect(screen.getByText('Aceptaste esta versión en este dispositivo.')).toBeInTheDocument()
    usuario.id = 'cuenta-b'
    vista.rerender(
      <MemoryRouter>
        <Terminos />
      </MemoryRouter>,
    )
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Registrar aceptación local' })).toBeDisabled()
  })
})
