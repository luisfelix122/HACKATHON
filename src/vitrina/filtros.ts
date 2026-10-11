import { LUGARES } from '../compartido/dominio/lugares'
import { TIPOS_PRODUCTO } from '../compartido/dominio/producto'

export type Filtros = {
  buscar: string
  lugar: string
  tipo: string
  asociacion: string
  etiqueta: string
}
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim()
}
export function leerFiltros(url: URLSearchParams): Filtros {
  const valor = (clave: string) => (url.get(clave) ?? '').trim()
  const lugar = valor('lugar')
  const tipo = valor('tipo')
  return {
    buscar: valor('buscar') ? (url.get('buscar') ?? '') : '',
    lugar: LUGARES.some((v) => v === lugar) ? lugar : '',
    tipo: TIPOS_PRODUCTO.some((v) => v === tipo) ? tipo : '',
    asociacion: valor('asociacion'),
    etiqueta: valor('etiqueta'),
  }
}
export function escribirFiltros(filtros: Filtros): URLSearchParams {
  const url = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros))
    if (valor.trim()) url.set(clave, clave === 'buscar' ? valor : valor.trim())
  return url
}
export function coincideProducto(
  producto: {
    nombre: string
    titulo: string
    lugar: string
    tipo_producto: string
    asociacion: string | null
    etiquetas: string[]
  },
  filtros: Filtros,
): boolean {
  const buscar = normalizar(filtros.buscar)
  return (
    (!buscar ||
      normalizar(producto.nombre).includes(buscar) ||
      normalizar(producto.titulo).includes(buscar)) &&
    (!filtros.lugar || producto.lugar === filtros.lugar) &&
    (!filtros.tipo || producto.tipo_producto === filtros.tipo) &&
    (!filtros.asociacion || producto.asociacion === filtros.asociacion) &&
    (!filtros.etiqueta || producto.etiquetas.includes(filtros.etiqueta))
  )
}
