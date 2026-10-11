import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Orden } from '../compartido/dominio/orden'
import { AccionesArtesano } from './AccionesArtesano'
import { AccionesComprador } from './AccionesComprador'

// PRP 013 (CC-17): rechazar, cancelar y verificar el abono piden confirmación en
// un modal; la RPC solo se llama al confirmar, una vez, y nunca al cerrar.
const rpc = vi.hoisted(() => vi.fn())
vi.mock('../compartido/supabase', async (original) => ({
  ...(await original<typeof import('../compartido/supabase')>()),
  obtenerSupabase: () => ({ rpc }),
}))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

beforeEach(() => {
  rpc.mockReset()
  rpc.mockResolvedValue({ data: { id: 'o-1' }, error: null })
})

function orden(estado: Orden['estado'], extra: Partial<Orden> = {}): Orden {
  return {
    id: 'o-1',
    producto_id: 'p-1',
    comprador_id: 'c-1',
    cantidad: 1,
    modalidad: 'recojo',
    datos_envio: null,
    detalle: null,
    costo_envio: null,
    total: 50,
    fecha_entrega_estimada: '2026-10-20',
    enlace_pago: 'https://pago.test/x',
    numero_guia: null,
    estado,
    creado_en: '2026-10-11T00:00:00Z',
    actualizado_en: '2026-10-11T00:00:00Z',
    ...extra,
  }
}

const contexto = { actor: 'artesano' as const, producto: null, enCurso: null }

describe('confirmaciones de las acciones de una orden', () => {
  it('comprador: «Cancelar pedido» abre la confirmación sin llamar a la RPC', () => {
    render(<AccionesComprador orden={orden('aceptada')} alCambiar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    expect(screen.getByRole('dialog', { name: '¿Cancelar este pedido?' })).toBeInTheDocument()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('comprador: cerrar la confirmación no cancela nada', () => {
    render(<AccionesComprador orden={orden('aceptada')} alCambiar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('comprador: confirmar llama una sola vez a cancelar_orden', async () => {
    const alCambiar = vi.fn()
    render(<AccionesComprador orden={orden('aceptada')} alCambiar={alCambiar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }))
    const dialogo = screen.getByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar pedido' }))
    await waitFor(() => expect(alCambiar).toHaveBeenCalledTimes(1))
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('cancelar_orden', { orden_id: 'o-1' })
  })

  it('artesano: «Rechazar pedido» no llama a la RPC hasta confirmar', async () => {
    render(
      <AccionesArtesano orden={orden('solicitada')} contexto={contexto} alCambiar={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar pedido' }))
    expect(rpc).not.toHaveBeenCalled()
    const dialogo = screen.getByRole('dialog', { name: '¿Rechazar este pedido?' })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Rechazar pedido' }))
    await waitFor(() => expect(rpc).toHaveBeenCalledWith('rechazar_orden', { orden_id: 'o-1' }))
  })

  it('artesano: verificar el abono pide confirmación y Esc no lo marca', () => {
    render(
      <AccionesArtesano orden={orden('pago_pendiente')} contexto={contexto} alCambiar={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Verificar abono' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('artesano: si la acción falla, el modal sigue abierto con el error y lo escrito', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'transicion_invalida' } })
    render(
      <AccionesArtesano
        orden={orden('pagada', {
          modalidad: 'envio',
          datos_envio: {
            nombre_destinatario: 'C',
            telefono: '+51900000000',
            departamento: 'Lima',
            provincia: 'Lima',
            distrito: 'Miraflores',
            agencia_destino: 'Shalom',
          },
        })}
        contexto={contexto}
        alCambiar={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Marcar enviada' }))
    fireEvent.change(screen.getByLabelText('Número de guía'), { target: { value: 'G-77' } })
    const dialogo = screen.getByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Marcar enviada' }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(/el pedido cambió/i)
    expect(screen.getByLabelText('Número de guía')).toHaveValue('G-77')
  })
})
