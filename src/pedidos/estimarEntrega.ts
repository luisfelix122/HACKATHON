import type { Modalidad } from '../compartido/dominio/orden'
import type { Disponibilidad } from '../compartido/dominio/producto'
export function hoyLima(ahora = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora)
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)!.value
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}
const DIAS: Record<string, number> = {
  Piura: 1,
  Tumbes: 2,
  Lambayeque: 2,
  Lima: 3,
  'La Libertad': 3,
}
export function estimarEntrega(
  disponibilidad: Disponibilidad,
  plazo: number | null,
  modalidad: Modalidad,
  departamento: string | null,
  ahora = new Date(),
): string {
  if (disponibilidad === 'a_pedido' && (!Number.isInteger(plazo) || plazo === null || plazo <= 0))
    throw new Error('No encontramos el plazo de elaboración. Actualiza el pedido.')
  const dias =
    (disponibilidad === 'a_pedido' ? plazo! : 0) +
    (modalidad === 'envio'
      ? Object.hasOwn(DIAS, departamento ?? '')
        ? (DIAS[departamento!] ?? 5)
        : 5
      : 0)
  const fecha = new Date(`${hoyLima(ahora)}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}
export function mostrarFecha(fecha: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'long' }).format(
    new Date(`${fecha}T12:00:00Z`),
  )
}
