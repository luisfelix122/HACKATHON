import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InicioArtesano } from './rutas'
import { AccesoAdmin } from '../admin/rutas'
import { cerrarSesion, useSesion } from '../compartido/sesion'
import { IngresoArtesano } from './IngresoArtesano'
import { usePerfil, useSesionApk } from './usePerfil'
import { leerPerfil } from './perfil'

vi.mock('../compartido/sesion', () => ({
  useSesion: vi.fn(),
  cerrarSesion: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('./usePerfil', () => ({ usePerfil: vi.fn(), useSesionApk: vi.fn(), guardarCopia: vi.fn() }))
vi.mock('./perfil', () => ({ leerPerfil: vi.fn() }))
vi.mock('./RegistroArtesano', () => ({ RegistroArtesano: () => <p>Formulario de registro</p> }))
afterEach(() => vi.clearAllMocks())
describe('rutas protegidas', () => {
  it('sin sesión dirige al ingreso', async () => {
    vi.mocked(useSesionApk).mockReturnValue({ sesion: null, cargando: false, errorRetorno: null })
    vi.mocked(usePerfil).mockReturnValue({
      perfil: null,
      cargando: false,
      error: null,
      actualizar: vi.fn(),
    })
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<InicioArtesano />} />
          <Route path="/ingresar" element={<p>Ingreso</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByText('Ingreso')).toBeTruthy()
  })
  it('sesión sin perfil muestra registro, nunca Mis productos', () => {
    vi.mocked(useSesionApk).mockReturnValue({
      sesion: { user: { id: 'u' } } as never,
      cargando: false,
      errorRetorno: null,
    })
    vi.mocked(usePerfil).mockReturnValue({
      perfil: null,
      cargando: false,
      error: null,
      actualizar: vi.fn(),
    })
    render(
      <MemoryRouter>
        <InicioArtesano />
      </MemoryRouter>,
    )
    expect(screen.getByText('Formulario de registro')).toBeTruthy()
    expect(screen.queryByText('Mis productos')).toBeNull()
  })
  it('conserva el rechazo del rol después de cerrar sesión', async () => {
    vi.mocked(useSesionApk).mockReturnValue({
      sesion: { user: { id: 'u' } } as never,
      cargando: false,
      errorRetorno: null,
    })
    vi.mocked(usePerfil).mockReturnValue({
      perfil: { rol: 'comprador' } as never,
      cargando: false,
      error: null,
      actualizar: vi.fn(),
    })
    vi.mocked(cerrarSesion).mockImplementationOnce(async () => {
      vi.mocked(useSesionApk).mockReturnValue({ sesion: null, cargando: false, errorRetorno: null })
    })
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<InicioArtesano />} />
          <Route path="/ingresar" element={<IngresoArtesano />} />
        </Routes>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Entrar a Ayllu' })).toBeTruthy()
    expect(
      screen.getByText(
        'Esta cuenta es de comprador. Para vender, crea tu cuenta con otro correo de Google.',
      ),
    ).toBeTruthy()
  })
  it('sale del ingreso cuando termina el canje de la sesión', async () => {
    vi.mocked(useSesionApk).mockReturnValue({ sesion: null, cargando: false, errorRetorno: null })
    const contenido = () => (
      <MemoryRouter initialEntries={['/ingresar']}>
        <Routes>
          <Route path="/ingresar" element={<IngresoArtesano />} />
          <Route path="/" element={<p>Destino después de Google</p>} />
        </Routes>
      </MemoryRouter>
    )
    const pantalla = render(contenido())
    vi.mocked(useSesionApk).mockReturnValue({
      sesion: { user: { id: 'u' } } as never,
      cargando: false,
      errorRetorno: null,
    })
    pantalla.rerender(contenido())
    expect(await screen.findByText('Destino después de Google')).toBeTruthy()
  })
  it('comprador no ve solicitudes de administración', async () => {
    vi.mocked(useSesion).mockReturnValue({
      sesion: { user: { id: 'u' } } as never,
      cargando: false,
    })
    vi.mocked(leerPerfil).mockResolvedValue({ rol: 'comprador' } as never)
    render(
      <MemoryRouter>
        <AccesoAdmin />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('Solo el administrador puede revisar las acreditaciones.'),
    ).toBeTruthy()
    expect(screen.queryByText('Acreditación RNA')).toBeNull()
  })
})
