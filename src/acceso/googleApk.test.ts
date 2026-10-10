import { beforeEach, describe, expect, it, vi } from 'vitest'

type Oyente = (evento: { url: string }) => Promise<void>
let oyente: Oyente | undefined
const remove = vi.fn().mockResolvedValue(undefined)
const close = vi.fn().mockResolvedValue(undefined)
const exchangeCodeForSession = vi.fn()

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: (_evento: string, fn: Oyente) => {
      oyente = fn
      return Promise.resolve({ remove })
    },
  },
}))
vi.mock('@capacitor/browser', () => ({ Browser: { open: vi.fn(), close } }))
vi.mock('../compartido/supabase', () => ({ supabase: { auth: { exchangeCodeForSession } } }))

const { escucharRetornoDeGoogle, leerRetorno } = await import('./googleApk')

describe('leerRetorno (CC-06)', () => {
  it('extrae el código del deep link de la app', () => {
    expect(leerRetorno('pe.ayllu.artesano://auth?code=abc123')).toEqual({ codigo: 'abc123' })
  })

  it('ignora URLs que no son exactamente el retorno de la app', () => {
    expect(leerRetorno('https://evil.example/auth?code=abc123')).toBeNull()
    expect(leerRetorno('pe.otra.app://auth?code=abc123')).toBeNull()
    expect(leerRetorno('pe.ayllu.artesano://auth.otro?code=abc123')).toBeNull()
    expect(leerRetorno('pe.ayllu.artesano://authx?code=abc123')).toBeNull()
    expect(leerRetorno('pe.ayllu.artesano://auth/extra?code=abc123')).toBeNull()
  })

  it('reporta el error cuando Google se cancela', () => {
    expect(leerRetorno('pe.ayllu.artesano://auth?error=access_denied')).toEqual({
      error: 'access_denied',
    })
  })
})

describe('escucharRetornoDeGoogle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    oyente = undefined
  })

  it('canjea el código y no avisa fallo si sale bien', async () => {
    const alFallar = vi.fn()
    escucharRetornoDeGoogle(alFallar)
    exchangeCodeForSession.mockResolvedValue({ error: null })
    await oyente?.({ url: 'pe.ayllu.artesano://auth?code=abc' })
    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc')
    expect(close).toHaveBeenCalled()
    expect(alFallar).not.toHaveBeenCalled()
  })

  it('avisa si el intercambio devuelve error o lanza', async () => {
    const alFallar = vi.fn()
    escucharRetornoDeGoogle(alFallar)
    exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'x' } })
    await oyente?.({ url: 'pe.ayllu.artesano://auth?code=abc' })
    exchangeCodeForSession.mockRejectedValueOnce(new Error('red'))
    await oyente?.({ url: 'pe.ayllu.artesano://auth?code=def' })
    expect(alFallar).toHaveBeenCalledTimes(2)
  })

  it('avisa y cierra el navegador si Google se cancela', async () => {
    const alFallar = vi.fn()
    escucharRetornoDeGoogle(alFallar)
    await oyente?.({ url: 'pe.ayllu.artesano://auth?error=access_denied' })
    expect(close).toHaveBeenCalled()
    expect(alFallar).toHaveBeenCalled()
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
  })

  it('deja de escuchar al desmontar', async () => {
    const dejar = escucharRetornoDeGoogle(vi.fn())
    dejar()
    await Promise.resolve()
    expect(remove).toHaveBeenCalled()
  })
})
