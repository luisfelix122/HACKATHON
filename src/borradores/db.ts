import Dexie, { type EntityTable } from 'dexie'
import type { Costeo, Disponibilidad } from '../compartido/dominio/producto'

export type EstadoSincronizacion = 'pendiente' | 'sincronizando' | 'sincronizado' | 'error'

export interface BorradorLocal {
  sincronizacion_iniciada?: boolean
  id: string
  artesano_id: string
  nombre: string
  descripcion_texto: string | null
  audio_blob: Blob | null
  audio_mime: string | null
  audio_ruta: string | null
  foto_blob: Blob
  foto_id: string
  /** Fotos propias además de la original (CC-21). Opcional: los borradores viejos no la tienen. */
  fotos_extra?: { id: string; blob: Blob }[]
  costeo: Costeo | null
  precio_final: number
  disponibilidad: Disponibilidad
  plazo_dias: number | null
  estado_sincronizacion: EstadoSincronizacion
  error_sincronizacion: string | null
  creado_en: string
  actualizado_en: string
}

export class AylluDatabase extends Dexie {
  borrador_local!: EntityTable<BorradorLocal, 'id'>

  constructor() {
    super('AylluDB')
    this.version(1).stores({
      borrador_local: 'id, artesano_id, estado_sincronizacion, creado_en',
    })
  }
}

export const db = new AylluDatabase()

/**
 * Solicita almacenamiento persistente al navegador/WebView para evitar desalojos en modo avión.
 */
export async function solicitarPersistenciaStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    try {
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }
  return false
}

export async function guardarBorrador(borrador: BorradorLocal): Promise<string> {
  if (typeof indexedDB === 'undefined') {
    return borrador.id
  }
  const anterior = await db.borrador_local.get(borrador.id)
  if (anterior?.sincronizacion_iniciada)
    throw new Error('Este borrador ya empezó a sincronizarse. Reintenta desde Mis productos.')
  // Propaga errores de cuota o almacenamiento para que la UI informe al artesano
  await db.borrador_local.put(borrador)
  return borrador.id
}

export async function obtenerBorrador(id: string): Promise<BorradorLocal | undefined> {
  if (typeof indexedDB === 'undefined') {
    return undefined
  }
  try {
    return await db.borrador_local.get(id)
  } catch {
    return undefined
  }
}

export async function listarBorradores(artesanoId?: string): Promise<BorradorLocal[]> {
  if (typeof indexedDB === 'undefined') {
    return []
  }
  if (!artesanoId) return []
  try {
    if (artesanoId) {
      return await db.borrador_local
        .where('artesano_id')
        .equals(artesanoId)
        .reverse()
        .sortBy('creado_en')
    }
    return await db.borrador_local.orderBy('creado_en').reverse().toArray()
  } catch {
    return []
  }
}

export async function eliminarBorrador(id: string): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return
  }
  try {
    await db.borrador_local.delete(id)
  } catch {
    // Si falla
  }
}
