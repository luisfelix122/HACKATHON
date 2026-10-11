import { describe, expect, it, vi } from 'vitest'
import { validarDatosEnvio, validarPedido, validarMensaje } from './datosEnvio'

const datos = {
  nombre_destinatario: 'Persona',
  telefono: '+51912345678',
  departamento: 'Piura',
  provincia: 'Talara',
  distrito: 'Lobitos',
  agencia_destino: 'Agencia',
}
describe('datos de despacho y entradas del pedido', () => {
  it('acepta un envío completo', () => expect(validarDatosEnvio(datos)).toEqual({}))
  it('exige teléfono y todos los campos', () => {
    for (const campo of Object.keys(datos))
      expect(validarDatosEnvio({ ...datos, [campo]: '  ' })).toHaveProperty(campo)
  })
  it('rechaza valores externos que no son texto', () =>
    expect(validarDatosEnvio({ ...datos, telefono: 123 })).toHaveProperty('telefono'))
  it('acepta recojo sin despacho', () =>
    expect(validarPedido({ cantidad: 1, modalidad: 'recojo', datos_envio: null })).toBeNull())
  it('rechaza cantidad cero, decimal, NaN y fuera de int32', () => {
    for (const cantidad of [0, -1, 1.5, NaN, Infinity, 2147483648])
      expect(validarPedido({ cantidad, modalidad: 'recojo', datos_envio: null })).not.toBeNull()
  })
  it('rechaza modalidad y detalle inválidos', () => {
    expect(validarPedido({ cantidad: 1, modalidad: 'otra', datos_envio: null })).not.toBeNull()
    expect(
      validarPedido({
        cantidad: 1,
        modalidad: 'recojo',
        datos_envio: null,
        detalle: 'a'.repeat(1001),
      }),
    ).not.toBeNull()
  })
  it('rechaza campos extra no contratados como DNI', () =>
    expect(validarDatosEnvio({ ...datos, dni: '123' })).toHaveProperty('datos_envio'))
  it('valida mensajes entre 1 y 1000 caracteres', () => {
    expect(validarMensaje('  ')).not.toBeNull()
    expect(validarMensaje('a'.repeat(1001))).not.toBeNull()
    expect(validarMensaje('Hola')).toBeNull()
    expect(validarMensaje('a'.repeat(1000))).toBeNull()
  })
})

// El cliente nunca recibe actor, montos, estado ni fechas de la entrada.
import type { SupabaseClient } from '@supabase/supabase-js'
import { crearOrden, enviarMensaje } from './consultas'
import { suscribirOrden } from './tiempoReal'

describe('frontera de pedidos', () => {
  it('crea únicamente por RPC sin campos privilegiados', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { id: 'orden' }, error: null })
    await crearOrden('producto', { cantidad: 1, modalidad: 'recojo', datos_envio: null }, {
      rpc,
    } as unknown as SupabaseClient)
    expect(rpc).toHaveBeenCalledWith('crear_orden', {
      producto_id: 'producto',
      cantidad: 1,
      modalidad: 'recojo',
      datos_envio: null,
      detalle: null,
    })
  })
  it('no llama al servidor con una cantidad inválida', async () => {
    const rpc = vi.fn()
    await expect(
      crearOrden('producto', { cantidad: 0, modalidad: 'recojo', datos_envio: null }, {
        rpc,
      } as unknown as SupabaseClient),
    ).rejects.toThrow('cantidad')
    expect(rpc).not.toHaveBeenCalled()
  })
  it('obtiene el autor del usuario autenticado y no de entrada externa', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const cliente = {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'actor-verificado' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({ insert }),
    }
    await enviarMensaje('orden', ' Hola ', cliente as unknown as SupabaseClient)
    expect(insert).toHaveBeenCalledWith({
      orden_id: 'orden',
      autor_id: 'actor-verificado',
      texto_original: 'Hola',
    })
  })
  it('no escribe sin usuario autenticado', async () => {
    const from = vi.fn()
    const cliente = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
      from,
    }
    await expect(
      enviarMensaje('orden', 'Hola', cliente as unknown as SupabaseClient),
    ).rejects.toThrow('Ingresa')
    expect(from).not.toHaveBeenCalled()
  })
  it('filtra ambos canales y los cancela, recuperando tras un fallo', () => {
    const on = vi.fn().mockReturnThis()
    const subscribe = vi.fn().mockReturnThis()
    const canal = { on, subscribe }
    const removeChannel = vi.fn().mockResolvedValue('ok')
    const cliente = { channel: vi.fn().mockReturnValue(canal), removeChannel }
    const cambio = vi.fn()
    const fallo = vi.fn()
    const cancelar = suscribirOrden('orden', cambio, fallo, cliente as unknown as SupabaseClient)
    expect(on.mock.calls[0]?.[1]).toMatchObject({
      event: 'UPDATE',
      table: 'orden',
      filter: 'id=eq.orden',
    })
    expect(on.mock.calls[1]?.[1]).toMatchObject({
      event: 'INSERT',
      table: 'mensaje_orden',
      filter: 'orden_id=eq.orden',
    })
    const estado = subscribe.mock.calls[0]?.[0] as (valor: string) => void
    estado('CHANNEL_ERROR')
    expect(fallo).toHaveBeenLastCalledWith(true)
    estado('SUBSCRIBED')
    expect(fallo).toHaveBeenLastCalledWith(false)
    expect(cambio).toHaveBeenCalled()
    cancelar()
    expect(removeChannel).toHaveBeenCalledWith(canal)
  })
})
