import { describe, expect, it } from 'vitest'
import { filtrarPedidos, iniciales, nombrePedido } from './bandeja'
import type { OrdenConProducto } from './consultas'
const pedidos = [
  { id: 'pedido-uno', nombre_producto: 'Poncho de algodón', modalidad: 'envio' },
  { id: 'pedido-dos', nombre_producto: null, modalidad: 'recojo' },
] as OrdenConProducto[]
describe('bandeja del pedido', () => {
  it('tolera producto oculto por RLS', () =>
    expect(nombrePedido(pedidos[1]!)).toBe('Pedido #pedido-d'))
  it('busca por nombre sin acentos y por identificador', () => {
    expect(filtrarPedidos(pedidos, 'ALGODON', 'todos')).toEqual([pedidos[0]])
    expect(filtrarPedidos(pedidos, 'pedido-dos', 'todos')).toEqual([pedidos[1]])
  })
  it('combina búsqueda y modalidad', () =>
    expect(filtrarPedidos(pedidos, 'poncho', 'recojo')).toEqual([]))
  it('usa iniciales sin asumir nombre de contraparte', () => {
    expect(iniciales('Poncho de algodón')).toBe('PD')
    expect(iniciales('')).toBe('P')
  })
})
