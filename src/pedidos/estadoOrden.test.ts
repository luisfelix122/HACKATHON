import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { accionesVisibles, contarEnCurso, avisoCarga, etiquetaEstado } from './estadoOrden'
import { ESTADOS_ORDEN } from '../compartido/dominio/orden'

describe('acciones de orden', () => {
  it('comprador nunca verifica el abono', () => {
    for (const estado of ESTADOS_ORDEN)
      expect(accionesVisibles('comprador', estado, 'envio')).not.toContain('verificar_abono')
  })
  it('respeta estado y modalidad', () => {
    expect(accionesVisibles('artesano', 'pagada', 'envio')).toEqual(['marcar_enviada'])
    expect(accionesVisibles('artesano', 'pagada', 'recojo')).toEqual(['marcar_lista_recojo'])
    expect(accionesVisibles('comprador', 'aceptada', 'envio')).toEqual([
      'confirmar_total',
      'cancelar_orden',
    ])
    expect(accionesVisibles('artesano', 'entregada', 'envio')).toEqual([])
  })
  it('cuenta solo aceptada hasta pagada y avisa desde cinco', () => {
    expect(contarEnCurso(ESTADOS_ORDEN.map((estado) => ({ estado })))).toBe(4)
    expect(avisoCarga(4)).toBeNull()
    expect(avisoCarga(5)).toContain('5 pedidos en curso')
    for (const estado of ESTADOS_ORDEN) expect(etiquetaEstado(estado)).not.toContain('_')
  })
})

import { act, createElement } from 'react'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Orden } from '../compartido/dominio/orden'
import { AccionesComprador } from './AccionesComprador'
import { AccionesArtesano } from './AccionesArtesano'
import { enlaceHttps, errorAccion, ejecutarAccion, leerContextoAcciones } from './acciones'
import * as acciones from './acciones'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { DetalleOrden } from './DetalleOrden'
const detalle = vi.hoisted(() => ({
  sesion: { user: { id: 'c' } } as { user: { id: string } } | null,
  obtener: vi.fn(),
  mensajes: vi.fn(),
  enviar: vi.fn(),
  suscribir: vi.fn(),
}))
vi.mock('../compartido/sesion', () => ({
  useSesion: () => ({ sesion: detalle.sesion, cargando: false }),
}))
vi.mock('./consultas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./consultas')>()),
  obtenerOrden: detalle.obtener,
  leerMensajes: detalle.mensajes,
  enviarMensaje: detalle.enviar,
}))
vi.mock('./tiempoReal', () => ({ suscribirOrden: detalle.suscribir }))
const falso = vi.hoisted(() => ({ rpc: vi.fn() }))
vi.mock('../compartido/supabase', () => ({ obtenerSupabase: () => falso }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('detalle conserva el borrador al actualizar', () => {
  beforeEach(() => {
    detalle.sesion = { user: { id: 'c' } }
    detalle.obtener.mockResolvedValue(orden)
    detalle.mensajes.mockResolvedValue([])
    detalle.suscribir.mockReturnValue(vi.fn())
    vi.spyOn(acciones, 'leerContextoAcciones').mockResolvedValue({
      actor: 'comprador',
      producto: null,
      enCurso: 0,
    })
  })
  function Navegacion() {
    const navegar = useNavigate()
    return createElement('button', { onClick: () => navegar('/pedidos/otra') }, 'Otro pedido')
  }
  function mostrar() {
    return render(
      createElement(
        MemoryRouter,
        { initialEntries: ['/pedidos/o'] },
        createElement(Navegacion),
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/pedidos/:id', element: createElement(DetalleOrden) }),
        ),
      ),
    )
  }
  it.each(['orden', 'mensajes', 'contexto'])(
    'conserva hilo, borrador y acciones cuando falla %s; reintenta',
    async (fallo) => {
      mostrar()
      const campo = await screen.findByLabelText('Mensaje')
      fireEvent.change(campo, { target: { value: 'Borrador sin enviar' } })
      if (fallo === 'orden') detalle.obtener.mockRejectedValueOnce(new Error('Sin conexión'))
      if (fallo === 'mensajes') detalle.mensajes.mockRejectedValueOnce(new Error('Sin conexión'))
      if (fallo === 'contexto')
        vi.mocked(acciones.leerContextoAcciones).mockRejectedValueOnce(new Error('Sin conexión'))
      fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
      await screen.findByText(/Sin conexión/)
      expect(screen.getByLabelText('Mensaje')).toBe(campo)
      expect(campo).toHaveValue('Borrador sin enviar')
      expect(screen.getByRole('button', { name: 'Confirmar total' })).toBeEnabled()
      fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
      await waitFor(() => expect(screen.queryByText(/Sin conexión/)).toBeNull())
      expect(screen.getByLabelText('Mensaje')).toBe(campo)
      expect(campo).toHaveValue('Borrador sin enviar')
    },
  )
  it('muestra error inicial sin datos y recupera mediante Reintentar', async () => {
    detalle.obtener.mockRejectedValueOnce(new Error('Sin conexión'))
    mostrar()
    await screen.findByText('Sin conexión')
    expect(screen.queryByLabelText('Mensaje')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await screen.findByLabelText('Mensaje')
  })
  it('no conserva datos ni borrador de otra ruta si falla su carga', async () => {
    mostrar()
    fireEvent.change(await screen.findByLabelText('Mensaje'), {
      target: { value: 'Privado anterior' },
    })
    detalle.obtener.mockRejectedValueOnce(new Error('Otra ruta sin conexión'))
    fireEvent.click(screen.getByRole('button', { name: 'Otro pedido' }))
    await screen.findByText('Otra ruta sin conexión')
    expect(screen.queryByLabelText('Mensaje')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Confirmar total' })).toBeNull()
  })
  it('no muestra datos de la cuenta anterior al cambiar de sesión', async () => {
    const vista = mostrar()
    await screen.findByLabelText('Mensaje')
    detalle.sesion = { user: { id: 'otra-cuenta' } }
    detalle.obtener.mockRejectedValueOnce(new Error('Cuenta sin conexión'))
    vista.rerender(
      createElement(
        MemoryRouter,
        { initialEntries: ['/pedidos/o'] },
        createElement(
          Routes,
          null,
          createElement(Route, { path: '/pedidos/:id', element: createElement(DetalleOrden) }),
        ),
      ),
    )
    await screen.findByText('Cuenta sin conexión')
    expect(screen.queryByLabelText('Mensaje')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Confirmar total' })).toBeNull()
  })
  it('ignora una respuesta atrasada del pedido anterior', async () => {
    let resolver!: (valor: Orden) => void
    detalle.obtener.mockImplementationOnce(
      () =>
        new Promise<Orden>((r) => {
          resolver = r
        }),
    )
    mostrar()
    detalle.obtener.mockResolvedValueOnce(null)
    fireEvent.click(screen.getByRole('button', { name: 'Otro pedido' }))
    await screen.findByText('No encontramos este pedido o no pertenece a tu cuenta.')
    await act(async () => {
      resolver(orden)
    })
    expect(screen.queryByLabelText('Mensaje')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Confirmar total' })).toBeNull()
  })
})
const orden: Orden = {
  id: 'o',
  producto_id: 'p',
  comprador_id: 'c',
  cantidad: 1,
  modalidad: 'envio',
  datos_envio: null,
  detalle: null,
  costo_envio: 2,
  total: 42,
  fecha_entrega_estimada: '2026-12-01',
  enlace_pago: 'https://pago.example',
  numero_guia: 'G-6',
  estado: 'aceptada',
  creado_en: '2026-10-10T00:00:00Z',
  actualizado_en: '2026-10-10T00:00:00Z',
}
describe('acciones en interfaz', () => {
  it('comprador no tiene Ya pagué ni verificar abono', () => {
    render(
      createElement(AccionesComprador, {
        orden: { ...orden, estado: 'pago_pendiente' },
        alCambiar: vi.fn(),
      }),
    )
    expect(screen.queryByRole('button', { name: /pagué|verificar/i })).toBeNull()
    expect(screen.getByRole('link', { name: 'Abrir enlace de pago' })).toHaveAttribute(
      'href',
      'https://pago.example',
    )
  })
  it('rastreo fijo no recibe número de guía', () => {
    render(
      createElement(AccionesComprador, {
        orden: { ...orden, estado: 'enviada' },
        alCambiar: vi.fn(),
      }),
    )
    expect(screen.getByText('Número de guía: G-6')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Rastrear envío' })).toHaveAttribute(
      'href',
      'https://shalom.com.pe/rastrea',
    )
    expect(screen.getByRole('link', { name: 'Rastrear envío' })).toHaveAttribute('target', '_blank')
  })
  it('deshabilita mientras espera, evita duplicado y muestra error crítico', async () => {
    let resolver!: (valor: { data: null; error: { message: string } }) => void
    falso.rpc.mockImplementation(
      () =>
        new Promise((r) => {
          resolver = r
        }),
    )
    render(createElement(AccionesComprador, { orden, alCambiar: vi.fn() }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar total' }))
    const boton = screen.getByRole('button', { name: 'Confirmar acuerdo' })
    fireEvent.click(boton)
    fireEvent.click(boton)
    expect(boton).toBeDisabled()
    expect(falso.rpc).toHaveBeenCalledTimes(1)
    resolver({ data: null, error: { message: 'transicion_invalida' } })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('El pedido cambió'))
    expect(boton).toBeEnabled()
  })
  it('aviso de cinco no bloquea aceptar y fecha es editable', () => {
    render(
      createElement(AccionesArtesano, {
        orden: { ...orden, estado: 'solicitada', modalidad: 'recojo' },
        contexto: {
          actor: 'artesano',
          producto: { disponibilidad: 'en_stock', plazo_dias: null, precio_final: 40 },
          enCurso: 5,
        },
        alCambiar: vi.fn(),
      }),
    )
    expect(screen.getByText(/Tienes 5 pedidos/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aceptar pedido' })).toBeEnabled()
    const fecha = screen.getByLabelText('Fecha estimada de entrega')
    fireEvent.change(fecha, { target: { value: '2027-01-01' } })
    expect(fecha).toHaveValue('2027-01-01')
  })
  it('envía RPC sin escritura directa y recarga tras éxito', async () => {
    falso.rpc.mockResolvedValue({ data: { ...orden, estado: 'confirmada' }, error: null })
    const cambiar = vi.fn()
    render(createElement(AccionesComprador, { orden, alCambiar: cambiar }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar total' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar acuerdo' }))
    await waitFor(() => expect(cambiar).toHaveBeenCalledOnce())
    expect(falso.rpc).toHaveBeenCalledWith('confirmar_total', { orden_id: 'o' })
  })
  it.each([
    'http://pago.example',
    'javascript:alert(1)',
    'https://',
    'https://usuario:clave@pago.example',
    'https://pago.example/ con espacio',
  ])('rechaza enlace inseguro %s', (valor) => expect(enlaceHttps(valor)).toBeNull())
  it('mapea permisos y red sin filtrar error técnico', () => {
    expect(errorAccion({ message: 'no_autorizado' })).toContain('Tu cuenta')
    expect(errorAccion({ message: 'datos_incompletos' })).toContain('Revisa el total')
    expect(errorAccion({ message: 'internal SQL details' })).toContain('Revisa tu conexión')
  })
  it('RPC propaga error legible', async () => {
    falso.rpc.mockResolvedValue({ data: null, error: { message: 'no_autorizado' } })
    await expect(ejecutarAccion('verificar_abono', 'o')).rejects.toThrow('Tu cuenta')
  })
})

it.each(['constructor', 'toString', '__proto__'])(
  'artesano puede cargar pedido con destino %s',
  async (departamento) => {
    const producto = {
      artesano_id: 'a',
      disponibilidad: 'en_stock',
      plazo_dias: null,
      precio_final: 40,
    }
    const consulta = {
      select: () => consulta,
      eq: () => consulta,
      maybeSingle: async () => ({ data: producto, error: null }),
      order: async () => ({ data: [], error: null }),
    }
    const cliente = {
      from: () => consulta,
    } as unknown as import('@supabase/supabase-js').SupabaseClient
    const pedido = {
      ...orden,
      datos_envio: {
        nombre_destinatario: 'Persona',
        telefono: '+51911111111',
        dni: '01234567',
        departamento,
        provincia: 'Provincia',
        distrito: 'Distrito',
        agencia_destino: 'Agencia',
      },
    }
    await expect(leerContextoAcciones(pedido, 'a', cliente)).resolves.toMatchObject({
      actor: 'artesano',
      enCurso: 0,
    })
  },
)
