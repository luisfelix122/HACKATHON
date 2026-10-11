import { describe, expect, it } from 'vitest'
import { leerFiltros, escribirFiltros, normalizar, coincideProducto } from './filtros'

describe('filtros de la vitrina', () => {
  it('permite escribir un espacio antes de continuar una búsqueda de varias palabras', () => {
    const filtros = leerFiltros(new URLSearchParams('buscar=Bolso'))
    expect(leerFiltros(escribirFiltros({ ...filtros, buscar: 'Bolso ' })).buscar).toBe('Bolso ')
  })
  it('conserva búsqueda y filtros combinados al compartir y recargar la URL', () => {
    const url = new URLSearchParams(
      'buscar=ÁRBOL&lugar=Lobitos&tipo=textil&asociacion=Mar&etiqueta=filigrana',
    )
    expect(leerFiltros(escribirFiltros(leerFiltros(url)))).toEqual(leerFiltros(url))
  })
  it('omite filtros vacíos y rechaza lugar y tipo fuera del contrato', () => {
    expect(
      escribirFiltros(
        leerFiltros(new URLSearchParams('lugar=Lima&tipo=desconocido&buscar=  ')),
      ).toString(),
    ).toBe('')
  })
  it('busca por nombre o título sin mayúsculas ni tildes', () => {
    expect(normalizar('  ÓRGANOS, PIÑÓN  ')).toBe('organos, pinon')
    const producto = {
      nombre: 'Pieza',
      titulo: 'Árbol',
      lugar: 'Lobitos',
      tipo_producto: 'textil',
      asociacion: 'Mar',
      etiquetas: ['filigrana'],
    }
    const filtros = leerFiltros(
      new URLSearchParams(
        'buscar=arbol&lugar=Lobitos&tipo=textil&asociacion=Mar&etiqueta=filigrana',
      ),
    )
    expect(coincideProducto(producto, filtros)).toBe(true)
    expect(coincideProducto(producto, { ...filtros, etiqueta: 'crochet' })).toBe(false)
    expect(coincideProducto({ ...producto, nombre: 'Árbol', titulo: 'Otro' }, filtros)).toBe(true)
  })
})
