import type { SupabaseClient } from '@supabase/supabase-js'
import type { FotoProducto } from '../compartido/dominio/producto'
import { comprimirFoto } from '../borradores/comprimirFoto'

/** Tope de fotos propias por producto; lo hace cumplir también la BD (0106). */
export const MAX_FOTOS_ADICIONALES = 8

export function rutaFotoAdicional(artesanoId: string, productoId: string, fotoId: string): string {
  return `${artesanoId}/${productoId}/foto-${fotoId}.jpg`
}

/** Quita el prefijo técnico (`no_autorizado: …`) de los errores de la BD. */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  const texto = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  const coincidencia = /^[a-z_]+:\s*(.+)$/.exec(texto)
  return coincidencia?.[1] ?? porDefecto
}

/**
 * Sube una foto propia del artesano (comprimida a JPEG) y la registra como
 * `adicional`, sin publicar: la selección se guarda luego con publicar_producto.
 */
export async function agregarFotoAdicional(
  cliente: SupabaseClient,
  datos: { artesanoId: string; productoId: string; archivo: Blob; posicion: number },
): Promise<FotoProducto> {
  const id = crypto.randomUUID()
  const ruta = rutaFotoAdicional(datos.artesanoId, datos.productoId, id)
  const foto = await comprimirFoto(datos.archivo)

  const subida = await cliente.storage
    .from('fotos')
    .upload(ruta, foto, { contentType: 'image/jpeg', upsert: false })
  if (subida.error) throw new Error('No pudimos subir la foto. Revisa tu conexión.')

  const { data, error } = await cliente
    .from('foto_producto')
    .insert({
      id,
      producto_id: datos.productoId,
      origen: 'adicional',
      variante: null,
      ruta,
      publicada: false,
      posicion: datos.posicion,
    })
    .select()
    .single()
  if (error || !data) {
    // Sin fila no queda referencia al archivo: se borra para no dejarlo huérfano.
    await cliente.storage.from('fotos').remove([ruta])
    throw new Error(mensajeDeError(error?.message, 'No pudimos guardar la foto.'))
  }
  return data as FotoProducto
}

/** Borra una foto adicional o de IA. La original nunca se borra (regla 3). */
export async function quitarFoto(
  cliente: SupabaseClient,
  foto: Pick<FotoProducto, 'id' | 'ruta' | 'origen'>,
): Promise<void> {
  if (foto.origen === 'original') throw new Error('La foto original no se puede quitar.')
  const { error } = await cliente.from('foto_producto').delete().eq('id', foto.id)
  if (error) throw new Error(mensajeDeError(error.message, 'No pudimos quitar la foto.'))
  await cliente.storage.from('fotos').remove([foto.ruta])
}

/**
 * Elimina un producto propio. Si tiene pedidos, la BD lo retira de la vitrina y
 * conserva el historial. Tras borrar, limpia sus archivos salvo la original,
 * que las políticas de Storage protegen.
 */
export async function eliminarProducto(
  cliente: SupabaseClient,
  datos: { artesanoId: string; productoId: string },
): Promise<'eliminado' | 'retirado'> {
  const { data, error } = await cliente.rpc('eliminar_producto', {
    p_producto_id: datos.productoId,
  })
  if (error) throw new Error(mensajeDeError(error.message, 'No pudimos eliminar el producto.'))
  const resultado = data === 'retirado' ? 'retirado' : 'eliminado'

  if (resultado === 'eliminado') {
    const carpeta = `${datos.artesanoId}/${datos.productoId}`
    const { data: archivos } = await cliente.storage.from('fotos').list(carpeta)
    const rutas = (archivos ?? [])
      .filter((archivo) => archivo.name !== 'original.jpg')
      .map((archivo) => `${carpeta}/${archivo.name}`)
    if (rutas.length > 0) await cliente.storage.from('fotos').remove(rutas)
  }
  return resultado
}
