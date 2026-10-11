import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LUGARES } from '../compartido/dominio/lugares'
import type { CatalogoPublico, ProductoPublico } from './consultas'
import { Portada } from './Portada'

const consulta = vi.hoisted(() => ({
  catalogo: vi.fn<() => Promise<CatalogoPublico>>(),
}))

vi.mock('./consultas', async (original) => ({
  ...(await original<typeof import('./consultas')>()),
  consultarCatalogo: consulta.catalogo,
  urlFoto: (ruta: string) => `https://fotos.test/${ruta}`,
}))

function pieza(id: number, extra: Partial<ProductoPublico> = {}): ProductoPublico {
  const sufijo = String(id).padStart(12, '0')
  return {
    id: `10000000-0000-4000-8000-${sufijo}`,
    artesano_id: `00000000-0000-4000-8000-${sufijo}`,
    nombre: `Pieza ${id}`,
    titulo: `Pieza número ${id}`,
    tipo_producto: 'textil',
    etiquetas: [],
    precio_final: 50,
    disponibilidad: 'en_stock',
    plazo_dias: null,
    artesano_nombre: `Artesana ${id}`,
    lugar: 'Lobitos',
    asociacion: null,
    ficha: {
      titulo: `Pieza número ${id}`,
      descripcion: 'Hecha a mano.',
      materiales: ['algodón'],
      tecnica: 'crochet',
      tipo_producto: 'textil',
      historia_pieza: '',
      etiquetas: [],
    },
    ...extra,
  }
}

/** Muestra la ruta y los filtros a los que llegó la navegación. */
function Destino() {
  const { pathname, search } = useLocation()
  return <p data-testid="destino">{pathname + search}</p>
}

function montar(ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="*" element={<Destino />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  consulta.catalogo.mockReset()
  consulta.catalogo.mockResolvedValue({ productos: [pieza(1), pieza(2)], fotos: [] })
})

describe('Portada (landing)', () => {
  it('presenta Ayllu con su propuesta de valor y un acceso destacado al catálogo', async () => {
    montar()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/hecho a mano/i)
    const acceso = screen.getAllByRole('link', { name: /ver el catálogo/i })[0]
    expect(acceso).toHaveAttribute('href', '/catalogo')
    await screen.findByRole('region', { name: /piezas de la vitrina/i })
  })

  it('cada caleta lleva al catálogo filtrado por ese lugar', async () => {
    montar()
    const caletas = screen.getByRole('navigation', { name: 'Las caletas' })
    for (const lugar of LUGARES) {
      expect(within(caletas).getByRole('link', { name: new RegExp(lugar) })).toHaveAttribute(
        'href',
        `/catalogo?lugar=${encodeURIComponent(lugar)}`,
      )
    }
    await screen.findByRole('region', { name: /piezas de la vitrina/i })
  })

  it('cada tipo de producto lleva al catálogo filtrado por tipo', async () => {
    montar()
    expect(screen.getByRole('link', { name: /bisutería marina/i })).toHaveAttribute(
      'href',
      `/catalogo?tipo=${encodeURIComponent('bisutería marina')}`,
    )
    await screen.findByRole('region', { name: /piezas de la vitrina/i })
  })

  it('muestra piezas y artesanos que vienen de la base, sin inventar', async () => {
    montar()
    const piezas = await screen.findByRole('region', { name: /piezas de la vitrina/i })
    expect(within(piezas).getByRole('link', { name: /Pieza número 1/ })).toHaveAttribute(
      'href',
      `/producto/${pieza(1).id}`,
    )
    const artesanos = screen.getByRole('region', { name: /quién lo hace/i })
    expect(within(artesanos).getByRole('link', { name: /Artesana 2/ })).toHaveAttribute(
      'href',
      `/artesano/${pieza(2).artesano_id}`,
    )
  })

  it('sin piezas publicadas muestra el estado vacío, no piezas de relleno', async () => {
    consulta.catalogo.mockResolvedValue({ productos: [], fotos: [] })
    montar()
    expect(
      await screen.findByText(/aparecen aquí cuando los artesanos las publican/i),
    ).toBeVisible()
    expect(screen.queryByRole('region', { name: /piezas de la vitrina/i })).not.toBeInTheDocument()
  })

  it('si la consulta falla, lo dice y ofrece reintentar', async () => {
    consulta.catalogo.mockRejectedValueOnce(new Error('red'))
    montar()
    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos cargar/i)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('el regreso de Google (/?code=…) y otros parámetros se quedan en la landing', async () => {
    montar('/?code=abc&utm_source=qr')
    expect(screen.queryByTestId('destino')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/hecho a mano/i)
    await screen.findByRole('region', { name: /piezas de la vitrina/i })
  })

  it('con filtros y otros parámetros, al catálogo solo pasan los filtros', () => {
    montar('/?lugar=Lobitos&utm_source=qr')
    expect(screen.getByTestId('destino')).toHaveTextContent('/catalogo?lugar=Lobitos')
    expect(screen.getByTestId('destino')).not.toHaveTextContent('utm_source')
  })

  it('un enlace antiguo con filtros (/?lugar=…) llega al catálogo con los mismos filtros', () => {
    montar('/?lugar=Lobitos&tipo=textil')
    expect(screen.getByTestId('destino')).toHaveTextContent('/catalogo?lugar=Lobitos&tipo=textil')
  })
})
