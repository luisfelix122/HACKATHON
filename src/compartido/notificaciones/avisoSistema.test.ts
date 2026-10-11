import { beforeEach, describe, expect, it, vi } from 'vitest'

const nativo = vi.hoisted(() => ({
  es: true,
  schedule: vi.fn(),
  requestPermissions: vi.fn(),
  addListener: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => nativo.es } }))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    schedule: nativo.schedule,
    requestPermissions: nativo.requestPermissions,
    addListener: nativo.addListener,
  },
}))

import { idAviso, mostrarAvisoSistema, prepararAvisosSistema } from './avisoSistema'

beforeEach(() => {
  nativo.es = true
  nativo.schedule.mockReset().mockResolvedValue({ notifications: [] })
  nativo.requestPermissions.mockReset().mockResolvedValue({ display: 'granted' })
  nativo.addListener.mockReset().mockResolvedValue({ remove: vi.fn() })
})

describe('avisos del sistema en la APK', () => {
  it('muestra la novedad en Android con el pedido para abrirlo', () => {
    mostrarAvisoSistema({ id: 'mensaje-1', orden: 'o-1', texto: 'Tienes un nuevo mensaje.' })
    expect(nativo.schedule).toHaveBeenCalledWith({
      notifications: [
        {
          id: idAviso('mensaje-1'),
          title: 'Ayllu',
          body: 'Tienes un nuevo mensaje.',
          extra: { orden: 'o-1' },
        },
      ],
    })
  })

  it('en la web no usa avisos nativos', () => {
    nativo.es = false
    mostrarAvisoSistema({ id: 'x', orden: 'o', texto: 't' })
    prepararAvisosSistema(() => {})
    expect(nativo.schedule).not.toHaveBeenCalled()
    expect(nativo.requestPermissions).not.toHaveBeenCalled()
  })

  it('al tocar el aviso abre su pedido', async () => {
    const abrir = vi.fn()
    prepararAvisosSistema(abrir)
    expect(nativo.requestPermissions).toHaveBeenCalled()
    const [, alTocar] = nativo.addListener.mock.calls[0]!
    alTocar({ notification: { extra: { orden: 'o-9' } } })
    expect(abrir).toHaveBeenCalledWith('o-9')
  })

  it('el id es un entero positivo y estable', () => {
    expect(idAviso('orden-1')).toBe(idAviso('orden-1'))
    expect(idAviso('orden-1')).toBeGreaterThan(0)
    expect(Number.isInteger(idAviso('orden-2'))).toBe(true)
  })
})
