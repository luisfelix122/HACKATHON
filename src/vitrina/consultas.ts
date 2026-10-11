import { z } from 'zod'
import { useEffect, useState } from 'react'
import { obtenerSupabase } from '../compartido/supabase'
import { TIPOS_PRODUCTO } from '../compartido/dominio/producto'
import { LUGARES } from '../compartido/dominio/lugares'

const ficha = z.object({
  titulo: z.string(),
  descripcion: z.string(),
  materiales: z.array(z.string()),
  tecnica: z.string(),
  tipo_producto: z.enum(TIPOS_PRODUCTO),
  historia_pieza: z.string(),
  etiquetas: z.array(z.string()),
})
const producto = z.object({
  id: z.guid(),
  artesano_id: z.guid(),
  nombre: z.string(),
  ficha,
  titulo: z.string(),
  tipo_producto: z.enum(TIPOS_PRODUCTO),
  etiquetas: z.array(z.string()),
  precio_final: z.number().positive(),
  disponibilidad: z.enum(['en_stock', 'a_pedido']),
  plazo_dias: z.number().int().positive().nullable(),
  artesano_nombre: z.string(),
  lugar: z.enum(LUGARES),
  asociacion: z.string().nullable(),
})
const foto = z.object({
  id: z.guid(),
  producto_id: z.guid(),
  origen: z.enum(['original', 'ia']),
  variante: z.enum(['estudio', 'luz', 'vitrina', 'contexto']).nullable(),
  ruta: z.string(),
  publicada: z.boolean(),
  posicion: z.number().int().nonnegative(),
})
const artesano = z.object({
  id: z.guid(),
  nombre: z.string(),
  lugar: z.enum(LUGARES),
  asociacion: z.string().nullable(),
  historia: z.string().nullable(),
  whatsapp: z.string(),
})
export type ProductoPublico = z.infer<typeof producto>
export type FotoPublica = z.infer<typeof foto>
export type ArtesanoPublico = z.infer<typeof artesano>
export type CatalogoPublico = { productos: ProductoPublico[]; fotos: FotoPublica[] }
const CAMPOS_PRODUCTO =
  'id,artesano_id,nombre,ficha,titulo,tipo_producto,etiquetas,precio_final,disponibilidad,plazo_dias,artesano_nombre,lugar,asociacion'
const CAMPOS_FOTO = 'id,producto_id,origen,variante,ruta,publicada,posicion'
export const idValido = (id: string) => z.guid().safeParse(id).success

export async function consultarCatalogo(artesanoId?: string): Promise<CatalogoPublico> {
  const cliente = obtenerSupabase()
  let consulta = cliente
    .from('producto_publico')
    .select(CAMPOS_PRODUCTO)
    .order('titulo')
    .order('id')
  if (artesanoId) consulta = consulta.eq('artesano_id', artesanoId)
  // Sin paginación visual; leer todos evita truncar filtros/chips al límite de PostgREST.
  const productos: ProductoPublico[] = []
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await consulta.range(desde, desde + 499)
    if (error) throw error
    const pagina = z.array(producto).parse(data)
    productos.push(...pagina)
    if (pagina.length < 500) break
  }
  const fotos: FotoPublica[] = []
  for (let desde = 0; desde < productos.length; desde += 100) {
    const ids = productos.slice(desde, desde + 100).map((p) => p.id)
    const { data, error } = await cliente
      .from('foto_publica')
      .select(CAMPOS_FOTO)
      .in('producto_id', ids)
      .eq('publicada', true)
      .order('posicion')
      .order('id')
    if (error) throw error
    fotos.push(...z.array(foto).parse(data))
  }
  return { productos, fotos }
}
export async function consultarProducto(id: string) {
  if (!idValido(id)) return null
  const cliente = obtenerSupabase()
  const { data, error } = await cliente
    .from('producto_publico')
    .select(CAMPOS_PRODUCTO)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const pieza = producto.parse(data)
  const [fotos, perfil] = await Promise.all([
    cliente
      .from('foto_publica')
      .select(CAMPOS_FOTO)
      .eq('producto_id', id)
      .order('posicion')
      .order('id'),
    consultarArtesano(pieza.artesano_id),
  ])
  if (fotos.error) throw fotos.error
  if (!perfil) return null
  return { producto: pieza, fotos: z.array(foto).parse(fotos.data), artesano: perfil }
}
export async function consultarArtesano(id: string): Promise<ArtesanoPublico | null> {
  if (!idValido(id)) return null
  const { data, error } = await obtenerSupabase()
    .from('artesano_publico')
    .select('id,nombre,lugar,asociacion,historia,whatsapp')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? artesano.parse(data) : null
}
export function urlFoto(ruta: string): string {
  return obtenerSupabase().storage.from('fotos').getPublicUrl(ruta).data.publicUrl
}
export function precioPEN(precio: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(precio)
}
/** Descartar respuestas anteriores al cambiar de ruta y permitir reintentos. */
export function useConsulta<T>(cargar: () => Promise<T>) {
  const [resultado, setResultado] = useState<{ cargar: typeof cargar; datos: T } | null>(null)
  const [fallo, setFallo] = useState<typeof cargar | null>(null)
  const [intento, setIntento] = useState(0)
  useEffect(() => {
    let vigente = true
    cargar()
      .then((datos) => {
        if (vigente) setResultado({ cargar, datos })
      })
      .catch(() => {
        if (vigente) setFallo(() => cargar)
      })
    return () => {
      vigente = false
    }
  }, [cargar, intento])
  return {
    datos: resultado?.cargar === cargar ? resultado.datos : undefined,
    error: fallo === cargar,
    reintentar: () => {
      setFallo(null)
      setResultado(null)
      setIntento((n) => n + 1)
    },
  }
}
