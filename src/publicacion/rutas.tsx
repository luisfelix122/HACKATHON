import type { RouteObject } from 'react-router-dom'
import { RevisarProducto } from './RevisarProducto'

// Costura del módulo A (Publicación).

/** Rutas de la web del comprador y del administrador. */
export const rutasWeb: RouteObject[] = []

/** Rutas de la APK del artesano. */
export const rutasArtesano: RouteObject[] = [
  {
    path: '/revisar/:id',
    element: <RevisarProducto />,
  },
]

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = []
