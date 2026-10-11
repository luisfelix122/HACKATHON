import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Orden } from '../compartido/dominio/orden'
import { AccionesArtesano } from './AccionesArtesano'
import { ComoPagar } from './PagoOrden'
import type { MetodoPago } from './metodosPago'

const falso = vi.hoisted(() => ({ metodos: [] as unknown[], rpc: vi.fn() }))
vi.mock('../compartido/supabase', () => ({
  obtenerSupabase: () => ({
    rpc: falso.rpc,
    from: () => ({
      select: () => ({
        eq: () => ({ order: async () => ({ data: falso.metodos, error: null }) }),
      }),
    }),
    storage: {
      from: () => ({
        getPublicUrl: (ruta: string) => ({ data: { publicUrl: `https://cobros.test/${ruta}` } }),
      }),
    },
  }),
}))

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

afterEach(() => {
  cleanup()
  falso.metodos = []
  falso.rpc.mockReset()
})

const yape: MetodoPago = {
  id: 'm-1',
  artesano_id: 'a-1',
  tipo: 'yape',
  titular: 'María Juárez',
  numero: '900000001',
  banco: null,
  cci: null,
  qr_ruta: 'a-1/yape-demo.png',
}
const cuenta: MetodoPago = {
  ...yape,
  id: 'm-2',
  tipo: 'cuenta_bancaria',
  numero: '000-0000000-0-01',
  banco: 'Banco Demo',
  cci: '00000000000000000001',
  qr_ruta: null,
}

describe('ComoPagar', () => {
  it('muestra el QR de Yape y la cuenta bancaria sin exigir enlace', async () => {
    falso.metodos = [yape, cuenta]
    render(<ComoPagar artesanoId="a-1" enlace={null} total={75} />)
    expect(await screen.findByRole('img', { name: 'QR de Yape de María Juárez' })).toHaveAttribute(
      'src',
      'https://cobros.test/a-1/yape-demo.png',
    )
    expect(screen.getByText('Banco Demo')).toBeInTheDocument()
    expect(screen.getByText('00000000000000000001')).toBeInTheDocument()
    expect(screen.getByText(/Cómo pagar S\/ 75\.00/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Pagar con enlace' })).toBeNull()
  })

  it('ofrece el enlace cuando el artesano lo agregó', async () => {
    render(<ComoPagar artesanoId="a-1" enlace="https://pago.test/x" total={null} />)
    expect(await screen.findByRole('link', { name: 'Pagar con enlace' })).toHaveAttribute(
      'href',
      'https://pago.test/x',
    )
  })

  it('avisa si no hay métodos ni enlace', async () => {
    render(<ComoPagar artesanoId="a-1" enlace={null} total={null} />)
    expect(await screen.findByText(/aún no dejó cómo pagarle/)).toBeInTheDocument()
  })
})

function orden(): Orden {
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
    enlace_pago: null,
    numero_guia: null,
    estado: 'confirmada',
    creado_en: '2026-10-11T00:00:00Z',
    actualizado_en: '2026-10-11T00:00:00Z',
  }
}
const contexto = { actor: 'artesano' as const, artesanoId: 'a-1', producto: null, enCurso: null }

describe('Pedir el pago', () => {
  it('con métodos guardados pide el pago sin enlace', async () => {
    falso.metodos = [yape]
    falso.rpc.mockResolvedValue({ data: { id: 'o-1' }, error: null })
    render(<AccionesArtesano orden={orden()} contexto={contexto} alCambiar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pedir el pago' }))
    await screen.findByText('900000001')
    const enviar = screen.getAllByRole('button', { name: 'Pedir el pago' }).at(-1)!
    await waitFor(() => expect(enviar).toBeEnabled())
    fireEvent.click(enviar)
    await waitFor(() =>
      expect(falso.rpc).toHaveBeenCalledWith('enviar_enlace_pago', {
        orden_id: 'o-1',
        enlace_pago: null,
      }),
    )
  })

  it('sin métodos ni enlace no deja pedir el pago', async () => {
    render(<AccionesArtesano orden={orden()} contexto={contexto} alCambiar={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Pedir el pago' }))
    expect(
      await screen.findByText('Agrega un método de cobro o un enlace de pago.'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Pedir el pago' }).at(-1)).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Enlace de pago (opcional)'), {
      target: { value: 'https://pago.test/x' },
    })
    expect(screen.getAllByRole('button', { name: 'Pedir el pago' }).at(-1)).toBeEnabled()
  })
})
