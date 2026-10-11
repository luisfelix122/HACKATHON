import type { SupabaseClient } from '@supabase/supabase-js'
import { obtenerSupabase } from '../compartido/supabase'

/** RLS filtra las partes; al desmontar se quitan todos los canales. */
export function suscribirOrden(
  id: string,
  alCambiar: () => void,
  alFallar: (fallo: boolean) => void,
  cliente: SupabaseClient = obtenerSupabase(),
): () => void {
  const canal = cliente
    .channel(`pedido-${id}-${crypto.randomUUID()}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orden', filter: `id=eq.${id}` },
      alCambiar,
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'mensaje_orden', filter: `orden_id=eq.${id}` },
      alCambiar,
    )
    .subscribe((estado) => {
      if (estado === 'SUBSCRIBED') {
        alFallar(false)
        alCambiar()
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(estado)) alFallar(true)
    })
  return () => {
    void cliente.removeChannel(canal)
  }
}
