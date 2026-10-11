import type { DatosEnvio, Modalidad } from '../compartido/dominio/orden'

export const CAMPOS_ENVIO = [
  'nombre_destinatario',
  'telefono',
  'departamento',
  'provincia',
  'distrito',
  'agencia_destino',
] as const
export function validarDatosEnvio(datos: unknown): Record<string, string> {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos))
    return { datos_envio: 'Completa los datos de envío.' }
  const campos = datos as Record<string, unknown>
  const errores: Record<string, string> = {}
  for (const campo of CAMPOS_ENVIO)
    if (typeof campos[campo] !== 'string' || !campos[campo].trim())
      errores[campo] = 'Completa este campo.'
  if (
    Object.keys(campos).some((campo) => ![...CAMPOS_ENVIO, 'referencia'].includes(campo)) ||
    (campos.referencia !== undefined && typeof campos.referencia !== 'string')
  )
    errores.datos_envio = 'Revisa los datos de envío.'
  return errores
}
export type EntradaPedido = {
  cantidad: number
  modalidad: Modalidad
  datos_envio: DatosEnvio | null
  detalle?: string | null
}
export function validarPedido(entrada: {
  cantidad: number
  modalidad: string
  datos_envio: unknown
  detalle?: string | null
}): string | null {
  if (!Number.isInteger(entrada.cantidad) || entrada.cantidad < 1 || entrada.cantidad > 2147483647)
    return 'La cantidad debe ser un número entero mayor que cero.'
  if (!['recojo', 'envio'].includes(entrada.modalidad)) return 'Elige recojo o envío.'
  if (entrada.detalle && [...entrada.detalle].length > 1000)
    return 'El detalle puede tener hasta 1000 caracteres.'
  if (entrada.modalidad === 'envio' && Object.keys(validarDatosEnvio(entrada.datos_envio)).length)
    return 'Completa los datos de envío.'
  if (entrada.modalidad === 'recojo' && entrada.datos_envio !== null)
    return 'El recojo no necesita datos de envío.'
  return null
}
export function validarMensaje(texto: string): string | null {
  return [...texto.trim()].length < 1 || [...texto.trim()].length > 1000
    ? 'Escribe entre 1 y 1000 caracteres.'
    : null
}
