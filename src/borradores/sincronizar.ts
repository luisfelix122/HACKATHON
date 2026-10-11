import type { SupabaseClient } from '@supabase/supabase-js'
import { obtenerSupabase } from '../compartido/supabase'
import { db, type BorradorLocal } from './db'

export interface ResultadoSincronizacion {
  exito: boolean
  id: string
  error?: string
}

export function obtenerExtensionAudio(mimeType?: string | null): string {
  if (!mimeType) return 'webm'
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('aac')) return 'aac'
  if (mimeType.includes('wav')) return 'wav'
  return 'webm'
}

/**
 * Sube un borrador local a Supabase de manera idempotente (docs/contratos.md §Sincronización):
 * 1. Sube la foto original comprimida al bucket 'fotos'.
 * 2. Sube el archivo de audio si existe al bucket 'audios'.
 * 3. Hace upsert en la tabla 'producto' con el mismo ID local. No envía revision_ia ni ia_intentos (el artesano no los escribe, regla RLS).
 * 4. Hace upsert en la tabla 'foto_producto' como fila original (publicada = true).
 * 5. Si todo tiene éxito, marca el borrador local como 'sincronizado' (o lo borra si se especifica).
 */
export async function sincronizarBorrador(
  borrador: BorradorLocal,
  cliente: SupabaseClient = obtenerSupabase(),
  opciones: { borrarTrasConfirmar?: boolean } = {},
): Promise<ResultadoSincronizacion> {
  const rutaFoto = `${borrador.artesano_id}/${borrador.id}/original.jpg`
  const extensionAudio = obtenerExtensionAudio(borrador.audio_mime)
  const rutaAudio = `${borrador.artesano_id}/${borrador.id}/descripcion.${extensionAudio}`

  // 1. Subir foto original
  try {
    const { error: errorFoto } = await cliente.storage
      .from('fotos')
      .upload(rutaFoto, borrador.foto_blob, {
        upsert: true,
        contentType: 'image/jpeg',
      })

    if (errorFoto) {
      throw new Error(`Error en storage de fotos: ${errorFoto.message}`)
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error desconocido al subir foto'
    await db.borrador_local.put({
      ...borrador,
      estado_sincronizacion: 'error',
      error_sincronizacion: mensaje,
      actualizado_en: new Date().toISOString(),
    })
    return { exito: false, id: borrador.id, error: mensaje }
  }

  // 2. Subir audio si existe
  let rutaAudioFinal: string | null = borrador.audio_ruta
  if (borrador.audio_blob) {
    try {
      const tipoAudio = borrador.audio_mime || 'audio/webm'
      const { error: errorAudio } = await cliente.storage
        .from('audios')
        .upload(rutaAudio, borrador.audio_blob, {
          upsert: true,
          contentType: tipoAudio,
        })

      if (errorAudio) {
        throw new Error(`Error en storage de audios: ${errorAudio.message}`)
      }
      rutaAudioFinal = rutaAudio
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido al subir audio'
      await db.borrador_local.put({
        ...borrador,
        estado_sincronizacion: 'error',
        error_sincronizacion: mensaje,
        actualizado_en: new Date().toISOString(),
      })
      return { exito: false, id: borrador.id, error: mensaje }
    }
  }

  // 3. Upsert a tabla 'producto' (sin revision_ia ni ia_intentos, contratos.md §Permisos)
  try {
    const { error: errorProd } = await cliente.from('producto').upsert({
      id: borrador.id,
      artesano_id: borrador.artesano_id,
      estado: 'borrador',
      nombre: borrador.nombre,
      descripcion_texto: borrador.descripcion_texto || null,
      audio_ruta: rutaAudioFinal,
      costeo: borrador.costeo || null,
      precio_final: borrador.precio_final,
      disponibilidad: borrador.disponibilidad,
      plazo_dias: borrador.disponibilidad === 'a_pedido' ? borrador.plazo_dias : null,
    })

    if (errorProd) {
      throw new Error(`Error al guardar producto: ${errorProd.message}`)
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al registrar producto'
    await db.borrador_local.put({
      ...borrador,
      estado_sincronizacion: 'error',
      error_sincronizacion: mensaje,
      actualizado_en: new Date().toISOString(),
    })
    return { exito: false, id: borrador.id, error: mensaje }
  }

  // 4. Upsert a tabla 'foto_producto'
  try {
    const { error: errorFotoProd } = await cliente.from('foto_producto').upsert({
      id: borrador.foto_id,
      producto_id: borrador.id,
      origen: 'original',
      variante: null,
      ruta: rutaFoto,
      publicada: true,
      posicion: 0,
    })

    if (errorFotoProd) {
      throw new Error(`Error al registrar foto original: ${errorFotoProd.message}`)
    }
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'Error al registrar foto'
    await db.borrador_local.put({
      ...borrador,
      estado_sincronizacion: 'error',
      error_sincronizacion: mensaje,
      actualizado_en: new Date().toISOString(),
    })
    return { exito: false, id: borrador.id, error: mensaje }
  }

  // 5. Confirmación en base local
  if (opciones.borrarTrasConfirmar) {
    await db.borrador_local.delete(borrador.id)
  } else {
    await db.borrador_local.put({
      ...borrador,
      audio_ruta: rutaAudioFinal,
      estado_sincronizacion: 'sincronizado',
      error_sincronizacion: null,
      actualizado_en: new Date().toISOString(),
    })
  }

  return { exito: true, id: borrador.id }
}

/**
 * Ejecuta la sincronización en lote para los borradores pendientes de un artesano.
 * Filtra los ya sincronizados para ahorrar datos y no reenviar archivos en zonas con baja señal.
 */
export async function sincronizarTodosLosBorradores(
  artesanoId: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<ResultadoSincronizacion[]> {
  const lista = await db.borrador_local
    .where('artesano_id')
    .equals(artesanoId)
    .filter((b) => b.estado_sincronizacion !== 'sincronizado')
    .toArray()

  const resultados: ResultadoSincronizacion[] = []

  for (const b of lista) {
    const res = await sincronizarBorrador(b, cliente)
    resultados.push(res)
  }

  return resultados
}
