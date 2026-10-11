import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Orden } from '../compartido/dominio/orden'
import type { Producto } from '../compartido/dominio/producto'
import { obtenerSupabase } from '../compartido/supabase'
import type { AccionOrden, ActorOrden } from './estadoOrden'
import { contarEnCurso } from './estadoOrden'
import { listarOrdenes } from './consultas'
import { estimarEntrega } from './estimarEntrega'
export function errorAccion(causa: unknown): string {
  const texto =
    causa && typeof causa === 'object' && 'message' in causa ? String(causa.message) : ''
  if (texto.includes('transicion_invalida'))
    return 'El pedido cambió. Toca Actualizar y revisa las acciones disponibles.'
  if (texto.includes('no_autorizado')) return 'Tu cuenta no puede realizar esta acción.'
  if (texto.includes('datos_incompletos'))
    return 'Revisa el total, la fecha y los datos de la acción.'
  return 'No pudimos conectar. Revisa tu conexión y reintenta.'
}
export function enlaceHttps(valor: string | null): string | null {
  if (!valor || !valor.startsWith('https://') || /\s/.test(valor)) return null
  try {
    const url = new URL(valor)
    return url.protocol === 'https:' && !url.username && !url.password ? valor : null
  } catch {
    return null
  }
}
export async function ejecutarAccion(
  accion: AccionOrden,
  id: string,
  datos: Record<string, unknown> = {},
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<Orden> {
  const { data, error } = await cliente.rpc(accion, { ...datos, orden_id: id })
  if (error || !data) throw new Error(errorAccion(error))
  return data as Orden
}
export function useAccionOrden(orden: Orden, alCambiar: () => void) {
  const bloqueo = useRef(false)
  const [pendiente, setPendiente] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function ejecutar(accion: AccionOrden, datos: Record<string, unknown> = {}) {
    if (bloqueo.current) return
    bloqueo.current = true
    setPendiente(true)
    setError(null)
    try {
      await ejecutarAccion(accion, orden.id, datos)
      alCambiar()
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : errorAccion(causa))
    } finally {
      bloqueo.current = false
      setPendiente(false)
    }
  }
  return { pendiente, error, ejecutar }
}
export type ContextoAcciones = {
  actor: ActorOrden | null
  producto: Pick<Producto, 'disponibilidad' | 'plazo_dias' | 'precio_final'> | null
  enCurso: number | null
}
export async function leerContextoAcciones(
  orden: Orden,
  usuario: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<ContextoAcciones> {
  const { data, error } = await cliente
    .from('producto')
    .select('artesano_id,disponibilidad,plazo_dias,precio_final')
    .eq('id', orden.producto_id)
    .maybeSingle()
  if (error) throw new Error(errorAccion(error))
  const actor =
    orden.comprador_id === usuario ? 'comprador' : data?.artesano_id === usuario ? 'artesano' : null
  // RLS filtra las órdenes. En APK el perfil autenticado es artesano.
  if (actor === 'artesano' && data?.disponibilidad) {
    estimarEntrega(
      data.disponibilidad,
      data.plazo_dias,
      orden.modalidad,
      orden.datos_envio?.departamento ?? null,
    )
  }
  const enCurso = actor === 'artesano' ? contarEnCurso(await listarOrdenes(cliente)) : null
  return { actor, producto: data, enCurso }
}
