// docs/contratos.md §producto, §Ficha y §foto_producto.
export const ESTADOS_PRODUCTO = [
  'borrador',
  'procesando',
  'en_revision',
  'publicado',
  'retirado',
] as const
export type EstadoProducto = (typeof ESTADOS_PRODUCTO)[number]

export const DISPONIBILIDADES = ['en_stock', 'a_pedido'] as const
export type Disponibilidad = (typeof DISPONIBILIDADES)[number]

export const REVISIONES_IA = ['sin_revisar', 'aprobada', 'rechazada'] as const
export type RevisionIa = (typeof REVISIONES_IA)[number]

/** Tipos de producto (docs/dominio.md, supuesto tomado del reto). */
export const TIPOS_PRODUCTO = [
  'textil',
  'bisutería marina',
  'tallado',
  'utilitario',
  'otro',
] as const
export type TipoProducto = (typeof TIPOS_PRODUCTO)[number]

/** Límites de la ficha; la base los vuelve a comprobar (ficha_valida). */
export const LIMITES_FICHA = {
  titulo: 80,
  descripcion: 1200,
  tecnica: 120,
  historia_pieza: 600,
  etiquetas: 8,
  etiquetaMin: 2,
  etiquetaMax: 30,
} as const

export type Ficha = {
  titulo: string
  descripcion: string
  materiales: string[]
  tecnica: string
  tipo_producto: TipoProducto
  historia_pieza: string
  etiquetas: string[]
}

/** Costeo en PEN. El precio sugerido se calcula a partir de él, no se guarda (CC-09). */
export type Costeo = {
  materiales: number
  horas: number
  pago_hora: number
  gastos: number
  ganancia: number
}

export type Producto = {
  id: string
  artesano_id: string
  estado: EstadoProducto
  nombre: string
  descripcion_texto: string | null
  audio_ruta: string | null
  ficha: Ficha | null
  costeo: Costeo | null
  precio_final: number | null
  disponibilidad: Disponibilidad | null
  plazo_dias: number | null
  revision_ia: RevisionIa
  comentario_precio_ia: string | null
  ia_error: string | null
  ia_intentos: number
  creado_en: string
  actualizado_en: string
}

export const ORIGENES_FOTO = ['original', 'ia'] as const
export type OrigenFoto = (typeof ORIGENES_FOTO)[number]

export const VARIANTES_FOTO = ['estudio', 'luz', 'vitrina', 'contexto'] as const
export type VarianteFoto = (typeof VARIANTES_FOTO)[number]

export type FotoProducto = {
  id: string
  producto_id: string
  origen: OrigenFoto
  /** Nula en la original. */
  variante: VarianteFoto | null
  /** Ruta en el bucket fotos. */
  ruta: string
  publicada: boolean
  posicion: number
  creado_en: string
}
