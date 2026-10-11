import { LocalNotifications } from '@capacitor/local-notifications'
import { useEffect, useState } from 'react'
import { reproducirChimeNotificacion } from '../../pedidos/tiempoReal'

export interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  fecha: string
  leida: boolean
  tipo: 'pedido' | 'mensaje' | 'acreditacion' | 'sistema'
  ordenId?: string
  enlace?: string
}

const CLAVE_ALMACEN = 'ayllu:notificaciones'
const EVENTO_CAMBIO = 'ayllu:notificaciones-cambio'

/** Inicializa permisos para notificaciones nativas en Android y navegadores compatibles. */
export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined' && 'Capacitor' in window) {
      const estado = await LocalNotifications.checkPermissions()
      if (estado.display === 'granted') return true
      const solicitud = await LocalNotifications.requestPermissions()
      return solicitud.display === 'granted'
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true
      const resultado = await Notification.requestPermission()
      return resultado === 'granted'
    }
  } catch (error) {
    console.warn('No se pudo verificar el permiso de notificaciones:', error)
  }
  return false
}

/** Obtiene la lista persistida de notificaciones desde localStorage. */
export function obtenerNotificaciones(): Notificacion[] {
  try {
    const raw = localStorage.getItem(CLAVE_ALMACEN)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as Notificacion[]) : []
  } catch {
    return []
  }
}

function guardarNotificaciones(notificaciones: Notificacion[]): void {
  try {
    localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(notificaciones.slice(0, 50)))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO))
    }
  } catch (error) {
    console.warn('Error al guardar notificaciones:', error)
  }
}

/** Registra y dispara una notificación push nativa / web y la guarda en el historial. */
export async function emitirNotificacionPush(datos: {
  titulo: string
  cuerpo: string
  tipo?: Notificacion['tipo']
  ordenId?: string
  enlace?: string
}): Promise<Notificacion> {
  const id = crypto.randomUUID()
  const fecha = new Date().toISOString()
  const nueva: Notificacion = {
    id,
    titulo: datos.titulo,
    cuerpo: datos.cuerpo,
    fecha,
    leida: false,
    tipo: datos.tipo ?? 'pedido',
    ordenId: datos.ordenId,
    enlace: datos.enlace ?? (datos.ordenId ? `/pedidos/${datos.ordenId}` : undefined),
  }

  const actuales = obtenerNotificaciones()
  guardarNotificaciones([nueva, ...actuales])

  // Emitir sonido y vibración
  reproducirChimeNotificacion()

  // Disparo nativo con Capacitor si está disponible
  try {
    const numericId = Math.abs(
      id.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0),
    )
    await LocalNotifications.schedule({
      notifications: [
        {
          id: numericId,
          title: nueva.titulo,
          body: nueva.cuerpo,
          sound: 'beep.wav',
          extra: {
            ordenId: nueva.ordenId,
            enlace: nueva.enlace,
          },
        },
      ],
    })
  } catch {
    // Si no es Capacitor nativo, intentar Web Notification
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(nueva.titulo, {
          body: nueva.cuerpo,
          icon: '/ayllu-icono.svg',
        })
      }
    } catch {
      // Ignorar si el navegador bloquea la notificación en segundo plano
    }
  }

  return nueva
}

/** Marca una notificación como leída. */
export function marcarLeida(id: string): void {
  const lista = obtenerNotificaciones().map((n) => (n.id === id ? { ...n, leida: true } : n))
  guardarNotificaciones(lista)
}

/** Marca todas las notificaciones como leídas. */
export function marcarTodasLeidas(): void {
  const lista = obtenerNotificaciones().map((n) => ({ ...n, leida: true }))
  guardarNotificaciones(lista)
}

/** Elimina una notificación específica. */
export function eliminarNotificacion(id: string): void {
  const lista = obtenerNotificaciones().filter((n) => n.id !== id)
  guardarNotificaciones(lista)
}

/** Limpia todo el historial de notificaciones. */
export function limpiarNotificaciones(): void {
  guardarNotificaciones([])
}

/** Cuenta el número de notificaciones no leídas. */
export function contarNoLeidas(): number {
  return obtenerNotificaciones().filter((n) => !n.leida).length
}

/** Hook React para reaccionar a cambios en las notificaciones en tiempo real. */
export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(() =>
    obtenerNotificaciones(),
  )
  const [noLeidas, setNoLeidas] = useState<number>(() => contarNoLeidas())

  useEffect(() => {
    function actualizar() {
      setNotificaciones(obtenerNotificaciones())
      setNoLeidas(contarNoLeidas())
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENTO_CAMBIO, actualizar)
      window.addEventListener('storage', actualizar)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENTO_CAMBIO, actualizar)
        window.removeEventListener('storage', actualizar)
      }
    }
  }, [])

  return {
    notificaciones,
    noLeidas,
    marcarLeida,
    marcarTodasLeidas,
    eliminarNotificacion,
    limpiarNotificaciones,
  }
}
