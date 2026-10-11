import type { RouteObject } from 'react-router-dom'
import { Catalogo } from './Catalogo'
import { FichaProducto } from './FichaProducto'
import { PerfilArtesano } from './PerfilArtesano'
import './vitrina.css'

// Costura del módulo (CC-11, docs/modulos.md regla 2): este módulo declara aquí sus
// rutas y su menú. src/app/ las monta sin editarse. Empieza vacío.

/** Rutas de la web del comprador y del administrador. */
export const rutasWeb: RouteObject[] = [
  { path: '/', element: <Catalogo /> },
  { path: '/producto/:id', element: <FichaProducto /> },
  { path: '/artesano/:id', element: <PerfilArtesano /> },
]

/** Rutas de la APK del artesano. */
export const rutasArtesano: RouteObject[] = []

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = []
