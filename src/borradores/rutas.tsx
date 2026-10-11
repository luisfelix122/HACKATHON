import type { RouteObject } from 'react-router-dom'
import { EditorBorrador } from './EditorBorrador'
import { MisProductos } from './MisProductos'

// Costura del módulo (CC-11, docs/modulos.md regla 2): este módulo declara aquí sus
// rutas y su menú. src/app/ las monta sin editarse.

/** Rutas de la web del comprador y del administrador. */
export const rutasWeb: RouteObject[] = []

/** Rutas de la APK del artesano. */
export const rutasArtesano: RouteObject[] = [
  { path: '/', element: <MisProductos /> },
  { path: '/nuevo', element: <EditorBorrador /> },
  { path: '/borrador/:id', element: <EditorBorrador /> },
]

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = [
  {
    etiqueta: 'Mis productos',
    ruta: '/',
  },
]
