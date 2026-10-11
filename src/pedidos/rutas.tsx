import type { RouteObject } from 'react-router-dom'
import { DetalleOrden } from './DetalleOrden'
import { MisPedidos } from './MisPedidos'
import { PantallaNotificaciones } from '../compartido/notificaciones/PantallaNotificaciones'

export const rutasWeb: RouteObject[] = [
  { path: '/pedidos', element: <MisPedidos /> },
  { path: '/pedidos/:id', element: <DetalleOrden /> },
  { path: '/notificaciones', element: <PantallaNotificaciones /> },
]

export const rutasArtesano: RouteObject[] = [...rutasWeb]

export const menuArtesano: { ruta: string; etiqueta: string }[] = [
  { ruta: '/pedidos', etiqueta: 'Mis pedidos' },
  { ruta: '/notificaciones', etiqueta: 'Notificaciones' },
]
