import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { iniciarGoogleApk } from './googleApk'
import { procesarRetornoInicial } from './usePerfil'
import { obtenerSupabase } from '../compartido/supabase'

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn(),
  },
}))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(), getLaunchUrl: vi.fn() } }))
vi.mock('../compartido/supabase', () => ({ obtenerSupabase: vi.fn(), CLAVE_SESION: 'ayllu.auth' }))
afterEach(() => vi.clearAllMocks())
describe('retorno Google APK', () => {
  it('canjea el retorno de arranque frío solo una vez entre varios consumidores', async () => {
    const nativo = vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    vi.mocked(App.getLaunchUrl).mockResolvedValue({ url: 'pe.ayllu.artesano://auth?code=arranque' })
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: { session: {} }, error: null })
    vi.mocked(obtenerSupabase).mockReturnValue({
      auth: { exchangeCodeForSession },
    } as unknown as SupabaseClient)
    await Promise.all([procesarRetornoInicial(), procesarRetornoInicial()])
    expect(App.getLaunchUrl).toHaveBeenCalledTimes(1)
    expect(exchangeCodeForSession).toHaveBeenCalledTimes(1)
    expect(exchangeCodeForSession).toHaveBeenCalledWith('arranque')
    nativo.mockRestore()
  })
  it('ignora destinos ajenos y canjea solo el deep link exacto', async () => {
    let recibir: ((evento: { url: string }) => void) | undefined
    const remove = vi.fn()
    vi.mocked(App.addListener).mockImplementation(async (_evento, callback) => {
      recibir = callback as unknown as (evento: { url: string }) => void
      return { remove }
    })
    vi.mocked(Browser.addListener).mockResolvedValue({ remove })
    vi.mocked(App.getLaunchUrl).mockResolvedValue(undefined)
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ data: { session: {} }, error: null })
    const cliente = {
      auth: {
        signInWithOAuth: vi
          .fn()
          .mockResolvedValue({ data: { url: 'https://accounts.google.com' }, error: null }),
        exchangeCodeForSession,
      },
    } as unknown as SupabaseClient
    const promesa = iniciarGoogleApk(cliente)
    await vi.waitFor(() => expect(Browser.open).toHaveBeenCalled())
    recibir?.({ url: 'pe.ayllu.artesano://auth.evil?code=robar' })
    recibir?.({ url: 'pe.ayllu.artesano://auth/otro?code=robar' })
    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    recibir?.({ url: 'pe.ayllu.artesano://auth?code=correcto' })
    await promesa
    expect(exchangeCodeForSession).toHaveBeenCalledWith('correcto')
    expect(Browser.close).toHaveBeenCalled()
    expect(remove).toHaveBeenCalledTimes(2)
  })
})
