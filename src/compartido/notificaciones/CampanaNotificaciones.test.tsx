import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CampanaNotificaciones } from './CampanaNotificaciones'

const mocks = vi.hoisted(() => ({ obtener: vi.fn(), quitar: vi.fn() }))
vi.mock('../supabase', () => ({ obtenerSupabase: mocks.obtener }))
type Canal = {
  on: ReturnType<typeof vi.fn>
  subscribe: ReturnType<typeof vi.fn>
  callbacks: Map<string, (payload: { new: Record<string, string> }) => void>
}
let canales: Canal[] = []
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
beforeEach(() => {
  canales = []
  mocks.quitar.mockReset().mockResolvedValue('ok')
  mocks.obtener.mockReset().mockReturnValue({
    channel: () => {
      const canal: Canal = { callbacks: new Map(), on: vi.fn(), subscribe: vi.fn() }
      canal.on.mockImplementation((_tipo, filtro, callback) => {
        canal.callbacks.set(`${filtro.table}:${filtro.event}`, callback)
        return canal
      })
      canal.subscribe.mockImplementation((callback) => {
        callback('SUBSCRIBED')
        return canal
      })
      canales.push(canal)
      return canal
    },
    removeChannel: mocks.quitar,
  })
})
afterEach(cleanup)
function vista(usuarioId: string) {
  return (
    <MemoryRouter>
      <CampanaNotificaciones usuarioId={usuarioId} />
    </MemoryRouter>
  )
}
function mensaje(autor: string) {
  act(() =>
    canales[0]!.callbacks.get('mensaje_orden:INSERT')!({
      new: { id: autor, orden_id: 'pedido-1', autor_id: autor, creado_en: '2026-10-11T15:30:00Z' },
    }),
  )
}

describe('CampanaNotificaciones', () => {
  it('avisa de mensajes ajenos y permite abrir el pedido y marcar la novedad leída', () => {
    render(vista('artesano'))
    mensaje('comprador')
    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones: 1 sin leer' }))
    const enlace = screen.getByRole('link', { name: /Tienes un nuevo mensaje/ })
    expect(enlace).toHaveAttribute('href', '/pedidos/pedido-1')
    fireEvent.click(enlace)
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
  })
  it('no cuenta los mensajes propios', () => {
    render(vista('artesano'))
    mensaje('artesano')
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
  })
  it('el cambio de cuenta limpia el canal y las novedades de la cuenta anterior', () => {
    const { rerender, unmount } = render(vista('artesano'))
    mensaje('comprador')
    rerender(vista('otra-cuenta'))
    expect(mocks.quitar).toHaveBeenCalledWith(canales[0])
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
    mensaje('viejo-evento')
    expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument()
    unmount()
    expect(mocks.quitar).toHaveBeenCalledWith(canales[1])
  })
  it('la configuración ausente no rompe el resto de la app', async () => {
    mocks.obtener.mockImplementation(() => {
      throw new Error('configuración ausente')
    })
    render(vista('artesano'))
    await act(async () => {
      await Promise.resolve()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Notificaciones' }))
    expect(screen.getByRole('status')).toHaveTextContent('Las notificaciones no están disponibles')
    expect(screen.getByRole('link', { name: 'Ver todos mis pedidos' })).toBeInTheDocument()
  })
})
