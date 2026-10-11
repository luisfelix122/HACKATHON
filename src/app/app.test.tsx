/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fireEvent, render, screen } from '@testing-library/react'
import { act } from 'react'
import { MemoryRouter } from 'react-router-dom'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppArtesano } from './AppArtesano'
import { AppWeb } from './AppWeb'
import { CLAVE_SESION, crearClienteSupabase } from '../compartido/supabase'
import { BotonPedir } from '../pedidos/BotonPedir'

// Se comprueban las opciones con las que se crea el cliente, sin red ni campos internos.
const createClient = vi.hoisted(() => vi.fn(() => ({ auth: {} })))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

// Cliente de Supabase simulado para la sesión de la web.
const supabaseFalso = vi.hoisted(() => {
  const estado = {
    sesion: null as null | { user: { id: string; email: string; user_metadata: object } },
  }
  const insert = vi.fn(() => ({
    select: () => ({
      single: () =>
        Promise.resolve({ data: { id: 'u-1', rol: 'comprador', nombre: 'Camila' }, error: null }),
    }),
  }))
  const canal = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(function (this: unknown, alCambiar: (estado: string) => void) {
      alCambiar('SUBSCRIBED')
      return this
    }),
  }
  const cliente = {
    channel: vi.fn(() => canal),
    removeChannel: vi.fn(() => Promise.resolve('ok')),

    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: estado.sesion }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
      signInWithOAuth: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
      }),
      insert,
    })),
  }
  return { estado, cliente, insert }
})
vi.mock('../compartido/supabase', async (original) => ({
  ...(await original<typeof import('../compartido/supabase')>()),
  obtenerSupabase: () => supabaseFalso.cliente,
}))

// Costuras: un módulo declara una ruta web, y otro una ruta y un menú de la APK.
vi.mock('../vitrina/rutas', async () => {
  const { createElement } = await import('react')
  return {
    rutasWeb: [{ path: '/ruta-de-modulo', element: createElement('h1', null, 'Ruta del módulo') }],
    rutasArtesano: [],
    menuArtesano: [],
  }
})
vi.mock('../borradores/rutas', async (original) => {
  const reales = await original<typeof import('../borradores/rutas')>()
  const { createElement } = await import('react')
  return {
    rutasWeb: [],
    rutasArtesano: [
      ...reales.rutasArtesano.filter((r) => r.path === '/'),
      { path: '/nuevo', element: createElement('h1', null, 'Nuevo producto') },
    ],
    menuArtesano: [{ ruta: '/nuevo', etiqueta: 'Nuevo' }],
  }
})

function irA(ruta: string) {
  window.history.pushState({}, '', ruta)
}

beforeEach(() => {
  supabaseFalso.estado.sesion = null
  supabaseFalso.insert.mockClear()
  supabaseFalso.cliente.auth.signInWithOAuth.mockClear()
  supabaseFalso.cliente.auth.signOut.mockReset()
  supabaseFalso.cliente.auth.signOut.mockResolvedValue({ error: null })
})

describe('AppWeb', () => {
  beforeEach(() => irA('/'))

  it('avisa si cerrar sesión falla y permite reintentar sin doble envío', async () => {
    supabaseFalso.estado.sesion = {
      user: { id: 'u-1', email: 'camila@correo.test', user_metadata: {} },
    }
    let responder!: (respuesta: { error: null }) => void
    supabaseFalso.cliente.auth.signOut.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          responder = resolve
        }),
    )
    render(<AppWeb />)
    const salir = await screen.findByRole('button', { name: 'Salir' })
    fireEvent.click(salir)
    expect(salir).toBeDisabled()
    fireEvent.click(salir)
    expect(supabaseFalso.cliente.auth.signOut).toHaveBeenCalledTimes(1)
    await act(async () => responder({ error: { message: 'Failed to fetch' } } as never))
    expect(
      await screen.findByText('No pudimos conectar. Revisa tu conexión y reintenta.'),
    ).toBeInTheDocument()
    expect(salir).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar salida' }))
    await vi.waitFor(() => expect(supabaseFalso.cliente.auth.signOut).toHaveBeenCalledTimes(2))
  })

  it('monta la portada en /', () => {
    render(<AppWeb />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ayllu' })).toBeInTheDocument()
  })

  it('monta la ficha en una ruta profunda /producto/:id', () => {
    irA('/producto/x')
    render(<AppWeb />)
    expect(screen.getByRole('heading', { level: 1, name: 'Producto' })).toBeInTheDocument()
  })

  it('/admin sin sesión exige ingreso y conserva el destino', async () => {
    irA('/admin')
    render(<AppWeb />)
    expect(await screen.findByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/ingresar')
    expect(new URLSearchParams(window.location.search).get('volver')).toBe('/admin')
  })

  it('muestra «Página no encontrada» en una ruta desconocida', () => {
    irA('/no-existe')
    render(<AppWeb />)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument()
  })

  it('monta una ruta declarada en el rutas.tsx de un módulo, sin editar src/app', () => {
    irA('/ruta-de-modulo')
    render(<AppWeb />)
    expect(screen.getByRole('heading', { level: 1, name: 'Ruta del módulo' })).toBeInTheDocument()
  })

  it('sin sesión, la barra ofrece «Ingresar» y vuelve a la página actual', async () => {
    irA('/producto/x')
    render(<AppWeb />)
    const enlace = await screen.findByRole('link', { name: 'Ingresar' })
    expect(enlace).toHaveAttribute('href', '/ingresar?volver=%2Fproducto%2Fx')
  })

  it('/ingresar ofrece «Continuar con Google» y vuelve a la ruta de origen', async () => {
    irA('/ingresar?volver=/producto/x')
    render(<AppWeb />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar con Google' }))
    expect(supabaseFalso.cliente.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/producto/x` },
    })
  })

  it('con sesión de Google y sin perfil, crea el perfil comprador una vez', async () => {
    supabaseFalso.estado.sesion = {
      user: { id: 'u-1', email: 'camila@correo.test', user_metadata: { full_name: 'Camila' } },
    }
    render(<AppWeb />)
    await vi.waitFor(() => expect(supabaseFalso.insert).toHaveBeenCalledTimes(1))
    expect(supabaseFalso.insert).toHaveBeenCalledWith({
      id: 'u-1',
      rol: 'comprador',
      nombre: 'Camila',
    })
    expect(await screen.findByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })
})

describe('AppArtesano', () => {
  beforeEach(() => irA('/'))

  it('sin sesión abre el ingreso, sin vitrina ni administración', async () => {
    render(<AppArtesano />)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entrar a Ayllu' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Mis productos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administración' })).not.toBeInTheDocument()
  })

  it('no ofrece /admin y exige ingreso del artesano', async () => {
    irA('/admin')
    render(<AppArtesano />)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Entrar a Ayllu' }),
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe('/ingresar')
  })

  it('arma su ruta y su menú desde el rutas.tsx de un módulo', () => {
    render(<AppArtesano />)
    const menu = screen.getByRole('navigation', { name: 'Menú' })
    expect(menu).toContainElement(screen.getByRole('link', { name: 'Nuevo' }))
    fireEvent.click(screen.getByRole('link', { name: 'Nuevo' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo producto' })).toBeInTheDocument()
  })
})

describe('BotonPedir (PRP 005)', () => {
  it('sin sesión inicia Google y conserva la ficha, los filtros y el pedido', async () => {
    render(
      <MemoryRouter initialEntries={['/producto/p-1?lugar=Lobitos']}>
        <BotonPedir productoId="p-1" />
      </MemoryRouter>,
    )
    const boton = screen.getByRole('button', { name: 'Pedir' })
    await vi.waitFor(() => expect(boton).toBeEnabled())
    fireEvent.click(boton)
    await vi.waitFor(() =>
      expect(supabaseFalso.cliente.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/producto/p-1?lugar=Lobitos&pedir=p-1`,
        },
      }),
    )
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
    expect(await screen.findByRole('heading', { name: 'Entrar a Ayllu' })).toBeInTheDocument()
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

describe('regresiones de estilos costeros comprobadas en runtime', () => {
  const webCss = readFileSync(`${process.cwd()}/src/app/web.css`, 'utf8')
  const artesanoCss = readFileSync(`${process.cwd()}/src/app/artesano.css`, 'utf8')
  const terminosCss = readFileSync(`${process.cwd()}/src/compartido/terminos.css`, 'utf8')
  it('la marca web declara color oscuro sobre la superficie cal', () => {
    expect(webCss).toMatch(/\.web-ayllu \.logotipo\s*\{[^}]*color:\s*var\(--casco-hondo\)/s)
  })
  it('el enlace de términos APK vence la regla compartida de enlaces de barra', () => {
    expect(artesanoCss).toMatch(
      /\.artesano-ayllu \.barra a\.artesano-terminos:not\(\.boton\)\s*\{[^}]*color:\s*var\(--casco-hondo\)/s,
    )
  })
  it('volver desde términos y marca web ofrecen al menos44px de alto', () => {
    expect(terminosCss).toMatch(/\.terminos > a\s*\{[^}]*min-height:\s*44px/s)
    expect(webCss).toMatch(
      /\.web-ayllu \.barra-contenido > a\[aria-label=['"]Ayllu, inicio['"]\]\s*\{[^}]*min-height:\s*44px/s,
    )
  })
})

describe('configuración de empaquetado público', () => {
  it('usa insets nativos sin la inyección CSS temprana de SystemBars', () => {
    const config = readFileSync(`${process.cwd()}/capacitor.config.ts`, 'utf8')
    expect(config).toMatch(/SystemBars:\s*\{\s*insetsHandling:\s*'native'/)
  })

  it('valida claves públicas en Node sin cargar Vite en el grafo del navegador', () => {
    const script = `
      import assert from 'node:assert/strict';
      import { validarEntornoPublico } from './vite.config.ts';
      const publico = { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_prueba' };
      assert.throws(() => validarEntornoPublico({}), /VITE_SUPABASE/);
      for (const url of ['no-url', 'file:///etc/config', 'https://usuario:clave@example.com']) {
        assert.throws(() => validarEntornoPublico({ ...publico, VITE_SUPABASE_URL: url }), /VITE_SUPABASE_URL/);
      }
      const jwt = role => 'e30.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.firma';
      for (const key of ['sb_secret_prueba', 'malformada', jwt('service_role')]) {
        assert.throws(() => validarEntornoPublico({ ...publico, VITE_SUPABASE_PUBLISHABLE_KEY: key }), /VITE_SUPABASE_PUBLISHABLE_KEY/);
      }
      assert.doesNotThrow(() => validarEntornoPublico({ ...publico, VITE_SUPABASE_PUBLISHABLE_KEY: jwt('anon') }));
      assert.doesNotThrow(() => validarEntornoPublico(publico));
    `
    expect(() =>
      execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
        cwd: process.cwd(),
        stdio: 'pipe',
        timeout: 15000,
      }),
    ).not.toThrow()
  })
})
