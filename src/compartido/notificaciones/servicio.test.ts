import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  contarNoLeidas,
  eliminarNotificacion,
  emitirNotificacionPush,
  limpiarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  obtenerNotificaciones,
} from './servicio'

describe('Servicio de Notificaciones', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('inicia con lista vacía y 0 no leídas', () => {
    expect(obtenerNotificaciones()).toEqual([])
    expect(contarNoLeidas()).toBe(0)
  })

  it('emite notificación push y la persiste como no leída', async () => {
    const notif = await emitirNotificacionPush({
      titulo: 'Nuevo pedido',
      cuerpo: 'Un comprador solicitó 2 unidades',
      tipo: 'pedido',
      ordenId: 'ord-123',
    })

    expect(notif.titulo).toBe('Nuevo pedido')
    expect(notif.cuerpo).toBe('Un comprador solicitó 2 unidades')
    expect(notif.leida).toBe(false)
    expect(notif.enlace).toBe('/pedidos/ord-123')

    const lista = obtenerNotificaciones()
    expect(lista).toHaveLength(1)
    expect(lista[0]?.id).toBe(notif.id)
    expect(contarNoLeidas()).toBe(1)
  })

  it('marca una notificación individual como leída', async () => {
    const notif = await emitirNotificacionPush({
      titulo: 'Mensaje nuevo',
      cuerpo: 'Hola artesano',
      tipo: 'mensaje',
    })

    expect(contarNoLeidas()).toBe(1)
    marcarLeida(notif.id)
    expect(contarNoLeidas()).toBe(0)
    expect(obtenerNotificaciones()[0]?.leida).toBe(true)
  })

  it('marca todas las notificaciones como leídas', async () => {
    await emitirNotificacionPush({ titulo: 'Aviso 1', cuerpo: 'Cuerpo 1' })
    await emitirNotificacionPush({ titulo: 'Aviso 2', cuerpo: 'Cuerpo 2' })

    expect(contarNoLeidas()).toBe(2)
    marcarTodasLeidas()
    expect(contarNoLeidas()).toBe(0)
  })

  it('elimina una notificación específica', async () => {
    const notif1 = await emitirNotificacionPush({ titulo: 'N1', cuerpo: 'C1' })
    const notif2 = await emitirNotificacionPush({ titulo: 'N2', cuerpo: 'C2' })

    expect(obtenerNotificaciones()).toHaveLength(2)
    eliminarNotificacion(notif1.id)
    const restantes = obtenerNotificaciones()
    expect(restantes).toHaveLength(1)
    expect(restantes[0]?.id).toBe(notif2.id)
  })

  it('limpia todas las notificaciones', async () => {
    await emitirNotificacionPush({ titulo: 'N1', cuerpo: 'C1' })
    await emitirNotificacionPush({ titulo: 'N2', cuerpo: 'C2' })
    expect(obtenerNotificaciones()).toHaveLength(2)

    limpiarNotificaciones()
    expect(obtenerNotificaciones()).toHaveLength(0)
    expect(contarNoLeidas()).toBe(0)
  })
})
