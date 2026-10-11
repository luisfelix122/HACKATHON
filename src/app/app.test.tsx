import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppArtesano } from './AppArtesano'
import { AppWeb } from './AppWeb'
import { CLAVE_SESION, crearClienteSupabase } from '../compartido/supabase'

// Se comprueban las opciones con las que se crea el cliente, sin red ni campos internos.
const createClient = vi.hoisted(() => vi.fn(() => ({ auth: {} })))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

function irA(ruta: string) {
  window.history.pushState({}, '', ruta)
}

describe('AppWeb', () => {
  beforeEach(() => irA('/'))

  it('monta la portada en /', () => {
    render(<AppWeb />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ayllu' })).toBeInTheDocument()
  })

  it('monta la ficha en una ruta profunda /producto/:id', () => {
    irA('/producto/x')
    render(<AppWeb />)
    expect(screen.getByRole('heading', { level: 1, name: 'Producto' })).toBeInTheDocument()
  })

  it('monta el panel en /admin', () => {
    irA('/admin')
    render(<AppWeb />)
    expect(screen.getByRole('heading', { level: 1, name: 'Administración' })).toBeInTheDocument()
  })

  it('muestra «Página no encontrada» en una ruta desconocida', () => {
    irA('/no-existe')
    render(<AppWeb />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument()
  })
})

describe('AppArtesano', () => {
  beforeEach(() => irA('/'))

  it('abre en «Mis productos» vacío, sin vitrina ni administración', () => {
    render(<AppArtesano />)
    expect(screen.getByRole('heading', { level: 1, name: 'Mis productos' })).toBeInTheDocument()
    expect(screen.getByText('Aún no tienes productos. Toca Nuevo.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administración' })).not.toBeInTheDocument()
  })

  it('no ofrece las rutas de la web: /admin vuelve a «Mis productos»', () => {
    irA('/admin')
    render(<AppArtesano />)
    expect(screen.getByRole('heading', { level: 1, name: 'Mis productos' })).toBeInTheDocument()
  })
})

describe('main.tsx elige la App según el modo', () => {
  let root: Root | undefined

  async function montarMain() {
    const { montada } = await import('../main')
    root = await montada
  }

  beforeEach(() => {
    irA('/')
    vi.resetModules()
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    act(() => root?.unmount())
    root = undefined
    vi.unstubAllEnvs()
    document.body.innerHTML = ''
  })

  it('con --mode artesano monta AppArtesano', async () => {
    vi.stubEnv('MODE', 'artesano')
    await montarMain()
    expect(await screen.findByRole('heading', { name: 'Mis productos' })).toBeInTheDocument()
  })

  it('con --mode web monta AppWeb', async () => {
    vi.stubEnv('MODE', 'web')
    await montarMain()
    expect(await screen.findByRole('heading', { level: 1, name: 'Ayllu' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mis productos' })).not.toBeInTheDocument()
  })

  it('si la App no carga, muestra un mensaje en vez de una pantalla en blanco', async () => {
    vi.stubEnv('MODE', 'web')
    vi.doMock('./AppWeb', () => {
      throw new Error('fragmento no disponible')
    })
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { montada } = await import('../main')
    expect(await montada).toBeUndefined()
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos abrir Ayllu')
    expect(error).toHaveBeenCalled()
    vi.doUnmock('./AppWeb')
    error.mockRestore()
  })

  it('falla con un mensaje claro si falta #root', async () => {
    vi.stubEnv('MODE', 'web')
    document.body.innerHTML = ''
    await expect(import('../main')).rejects.toThrow('No existe el elemento #root')
  })
})

describe('cliente Supabase', () => {
  beforeEach(() => createClient.mockClear())

  it('falla con un mensaje claro si faltan las variables de entorno', () => {
    expect(() => crearClienteSupabase({})).toThrow(
      'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY',
    )
    expect(() => crearClienteSupabase({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321' })).toThrow(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    )
  })

  it('crea el cliente con las variables y guarda la sesión con la clave fija', () => {
    crearClienteSupabase({
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'clave-publicable-de-prueba',
    })
    expect(CLAVE_SESION).toBe('ayllu.auth')
    expect(createClient).toHaveBeenCalledWith(
      'http://127.0.0.1:54321',
      'clave-publicable-de-prueba',
      expect.objectContaining({
        auth: expect.objectContaining({ persistSession: true, storageKey: CLAVE_SESION }),
      }),
    )
  })
})
