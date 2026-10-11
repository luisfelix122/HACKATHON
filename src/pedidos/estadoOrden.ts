import type { EstadoOrden, Modalidad } from '../compartido/dominio/orden'
export type ActorOrden = 'comprador' | 'artesano'
export type AccionOrden =
  | 'aceptar_orden'
  | 'rechazar_orden'
  | 'confirmar_total'
  | 'enviar_enlace_pago'
  | 'verificar_abono'
  | 'marcar_enviada'
  | 'marcar_lista_recojo'
  | 'marcar_entregada'
  | 'cancelar_orden'
const ETIQUETAS: Record<EstadoOrden, string> = {
  solicitada: 'Solicitud recibida',
  aceptada: 'Esperando confirmar el total',
  rechazada: 'Solicitud rechazada',
  confirmada: 'Total confirmado',
  pago_pendiente: 'Esperando el pago',
  pagada: 'Abono verificado',
  enviada: 'Enviada',
  lista_para_recojo: 'Lista para recojo',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}
export function etiquetaEstado(estado: EstadoOrden) {
  return ETIQUETAS[estado]
}
export function accionesVisibles(
  actor: ActorOrden,
  estado: EstadoOrden,
  modalidad: Modalidad,
): AccionOrden[] {
  const cancelar: AccionOrden[] = ['aceptada', 'confirmada', 'pago_pendiente'].includes(estado)
    ? ['cancelar_orden']
    : []
  if (actor === 'comprador')
    return estado === 'aceptada' ? ['confirmar_total', ...cancelar] : cancelar
  switch (estado) {
    case 'solicitada':
      return ['aceptar_orden', 'rechazar_orden']
    case 'confirmada':
      return ['enviar_enlace_pago', ...cancelar]
    case 'pago_pendiente':
      return ['verificar_abono', ...cancelar]
    case 'pagada':
      return [modalidad === 'envio' ? 'marcar_enviada' : 'marcar_lista_recojo']
    case 'enviada':
    case 'lista_para_recojo':
      return ['marcar_entregada']
    default:
      return cancelar
  }
}
export function contarEnCurso(ordenes: ReadonlyArray<{ estado: EstadoOrden }>) {
  return ordenes.filter((o) =>
    ['aceptada', 'confirmada', 'pago_pendiente', 'pagada'].includes(o.estado),
  ).length
}
export function avisoCarga(cantidad: number) {
  return cantidad >= 5
    ? `Tienes ${cantidad} pedidos en curso. Revisa que puedas cumplir la fecha.`
    : null
}
