import { describe, expect, it } from 'vitest'
import { estimarEntrega, hoyLima } from './estimarEntrega'
describe('estimación en Lima', () => {
  const ahora = new Date('2026-10-11T03:00:00Z')
  it('usa día de Lima en el cambio UTC', () => expect(hoyLima(ahora)).toBe('2026-10-10'))
  it('suma plazo y envío a Lima', () =>
    expect(estimarEntrega('a_pedido', 4, 'envio', 'Lima', ahora)).toBe('2026-10-17'))
  it('recojo en stock no suma días', () =>
    expect(estimarEntrega('en_stock', null, 'recojo', null, ahora)).toBe('2026-10-10'))
  it.each([
    ['Piura', 1],
    ['Tumbes', 2],
    ['Lambayeque', 2],
    ['La Libertad', 3],
    ['Cusco', 5],
  ])('destino %s', (destino, dias) =>
    expect(estimarEntrega('en_stock', null, 'envio', destino, ahora)).toBe(
      `2026-10-${10 + Number(dias)}`,
    ),
  )
  it('maneja cambio de mes', () =>
    expect(estimarEntrega('a_pedido', 3, 'envio', 'Lima', new Date('2026-12-30T17:00:00Z'))).toBe(
      '2027-01-05',
    ))
})

it.each(['constructor', 'toString', '__proto__'])(
  'destino heredado %s usa cinco días',
  (departamento) => {
    expect(
      estimarEntrega('en_stock', null, 'envio', departamento, new Date('2026-10-10T17:00:00Z')),
    ).toBe('2026-10-15')
  },
)
