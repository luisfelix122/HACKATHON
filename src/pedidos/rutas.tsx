import type { RouteObject } from 'react-router-dom'

// Costura del módulo (CC-11, docs/modulos.md regla 2): este módulo declara aquí sus
// rutas y su menú. src/app/ las monta sin editarse. Empieza vacío.

/** Rutas de la web del comprador y del administrador. */
export const rutasWeb: RouteObject[] = []

/** Rutas de la APK del artesano. */
export const rutasArtesano: RouteObject[] = []

/** Entradas del menú de la APK, en orden. */
export const menuArtesano: { ruta: string; etiqueta: string }[] = []
