import type { SupabaseClient } from '@supabase/supabase-js'
import type { Orden } from '../compartido/dominio/orden'
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

/**
 * Escucha nuevas órdenes en tiempo real para alertar al artesano cuando recibe un pedido.
 * Al desmontar se cancela el canal.
 */
export function suscribirNuevosPedidos(
  alRecibirNuevo: (orden: Orden) => void,
  alFallar?: (fallo: boolean) => void,
  cliente: SupabaseClient = obtenerSupabase(),
): () => void {
  const canal = cliente
    .channel(`nuevos-pedidos-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orden' }, (payload) => {
      if (payload.new) {
        alRecibirNuevo(payload.new as Orden)
      }
    })
    .subscribe((estado) => {
      if (estado === 'SUBSCRIBED') {
        alFallar?.(false)
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(estado)) {
        alFallar?.(true)
      }
    })
  return () => {
    void cliente.removeChannel(canal)
  }
}

/** Emite un sonido suave y vibración de notificación para avisar de nuevo pedido. */
export function reproducirChimeNotificacion(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15) // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.45)

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([150, 80, 150])
    }
  } catch {
    // Si la interacción previa no permite audio, se omite limpiamente
  }
}
