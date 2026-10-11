import type { Modalidad } from '../compartido/dominio/orden'
import type { OrdenConProducto } from './consultas'
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es').trim()
export function nombrePedido(orden: Pick<OrdenConProducto, 'id' | 'nombre_producto'>): string {
  return orden.nombre_producto?.trim() || 'Pedido #' + orden.id.slice(0, 8)
}
export function iniciales(nombre: string): string {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => [...p][0])
      .join('')
      .toLocaleUpperCase('es') || 'P'
  )
}
export function filtrarPedidos(
  ordenes: OrdenConProducto[],
  buscar: string,
  modalidad: Modalidad | 'todos',
): OrdenConProducto[] {
  const termino = normalizar(buscar)
  return ordenes.filter(
    (orden) =>
      (modalidad === 'todos' || orden.modalidad === modalidad) &&
      (!termino ||
        normalizar(nombrePedido(orden)).includes(termino) ||
        normalizar(orden.id).includes(termino)),
  )
}
