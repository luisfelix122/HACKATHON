import type { SupabaseClient } from '@supabase/supabase-js'
import type { MensajeOrden, Orden } from '../compartido/dominio/orden'
import { obtenerSupabase } from '../compartido/supabase'
import { validarMensaje, validarPedido, type EntradaPedido } from './datosEnvio'

export function mensajeError(causa: unknown): string {
  const texto =
    causa && typeof causa === 'object' && 'message' in causa ? String(causa.message) : ''
  if (texto.includes('datos_incompletos')) return 'Revisa los datos del pedido.'
  if (texto.includes('transicion_invalida'))
    return 'El producto ya no está disponible. Vuelve a la ficha.'
  if (texto.includes('no_autorizado')) return 'Tu cuenta no puede realizar esta acción.'
  return 'No pudimos conectar. Revisa tu conexión y reintenta.'
}
export async function crearOrden(
  productoId: string,
  entrada: EntradaPedido,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<Orden> {
  const invalido = validarPedido(entrada)
  if (invalido) throw new Error(invalido)
  const { data, error } = await cliente.rpc('crear_orden', {
    producto_id: productoId,
    cantidad: entrada.cantidad,
    modalidad: entrada.modalidad,
    datos_envio: entrada.datos_envio,
    detalle: entrada.detalle ?? null,
  })
  if (error || !data) throw new Error(mensajeError(error))
  return data as Orden
}
export async function listarOrdenes(cliente: SupabaseClient = obtenerSupabase()): Promise<Orden[]> {
  const { data, error } = await cliente
    .from('orden')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error) throw new Error(mensajeError(error))
  return data as Orden[]
}
export async function obtenerOrden(
  id: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<Orden | null> {
  const { data, error } = await cliente.from('orden').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(mensajeError(error))
  return data as Orden | null
}
export async function leerMensajes(
  id: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<MensajeOrden[]> {
  const { data, error } = await cliente
    .from('mensaje_orden')
    .select('*')
    .eq('orden_id', id)
    .order('creado_en')
    .order('id')
  if (error) throw new Error(mensajeError(error))
  return data as MensajeOrden[]
}
export async function enviarMensaje(
  id: string,
  texto: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<void> {
  const invalido = validarMensaje(texto)
  if (invalido) throw new Error(invalido)
  const { data: usuario, error: errorUsuario } = await cliente.auth.getUser()
  if (errorUsuario || !usuario.user) throw new Error('Ingresa para escribir en tu pedido.')
  const { error } = await cliente
    .from('mensaje_orden')
    .insert({ orden_id: id, autor_id: usuario.user.id, texto_original: texto.trim() })
  if (error) throw new Error(mensajeError(error))
}
