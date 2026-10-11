import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

/*
 * En la APK, cada novedad del pedido también aparece en la barra de Android.
 * Llega mientras la app sigue viva (abierta o en segundo plano reciente): sin
 * Firebase no hay avisos con la app cerrada.
 */

/** Id entero estable para Android a partir del id de la novedad. */
export function idAviso(texto: string): number {
  let hash = 0
  for (let i = 0; i < texto.length; i++) hash = (Math.imul(31, hash) + texto.charCodeAt(i)) | 0
  return Math.abs(hash) || 1
}

/** Pide permiso y abre el pedido al tocar el aviso. Devuelve cómo dejar de escuchar. */
export function prepararAvisosSistema(abrirPedido: (orden: string) => void): () => void {
  if (!Capacitor.isNativePlatform()) return () => {}
  let activo = true
  let quitar: (() => void) | undefined
  void LocalNotifications.requestPermissions().catch(() => {})
  void LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
    const orden = (notification.extra as { orden?: unknown } | undefined)?.orden
    if (typeof orden === 'string') abrirPedido(orden)
  })
    .then((escucha) => {
      if (activo) quitar = () => void escucha.remove()
      else void escucha.remove()
    })
    .catch(() => {})
  return () => {
    activo = false
    quitar?.()
  }
}

export function mostrarAvisoSistema(novedad: { id: string; orden: string; texto: string }) {
  if (!Capacitor.isNativePlatform()) return
  void LocalNotifications.schedule({
    notifications: [
      {
        id: idAviso(novedad.id),
        title: 'Ayllu',
        body: novedad.texto,
        extra: { orden: novedad.orden },
      },
    ],
  }).catch(() => {})
}
