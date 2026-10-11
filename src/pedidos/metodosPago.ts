import type { SupabaseClient } from '@supabase/supabase-js'
import { obtenerSupabase } from '../compartido/supabase'
import { mensajeError } from './consultas'

/*
 * Métodos de cobro del artesano (migración 0305): Yape, Plin o cuenta bancaria.
 * El comprador los ve solo mientras la orden espera su pago (RLS).
 */
export const TIPOS_METODO_PAGO = ['yape', 'plin', 'cuenta_bancaria'] as const
export type TipoMetodoPago = (typeof TIPOS_METODO_PAGO)[number]

export const NOMBRE_TIPO: Record<TipoMetodoPago, string> = {
  yape: 'Yape',
  plin: 'Plin',
  cuenta_bancaria: 'Cuenta bancaria',
}

export type MetodoPago = {
  id: string
  artesano_id: string
  tipo: TipoMetodoPago
  titular: string
  numero: string
  banco: string | null
  cci: string | null
  qr_ruta: string | null
}

export type BorradorMetodoPago = {
  tipo: TipoMetodoPago
  titular: string
  numero: string
  banco: string
  cci: string
}

type DatosMetodoPago = Pick<MetodoPago, 'tipo' | 'titular' | 'numero' | 'banco' | 'cci'>
type ErroresMetodoPago = Partial<Record<keyof BorradorMetodoPago, string>>

export function validarMetodoPago(borrador: BorradorMetodoPago): {
  datos: DatosMetodoPago | null
  errores: ErroresMetodoPago
} {
  const errores: ErroresMetodoPago = {}
  const titular = borrador.titular.trim()
  const banco = borrador.banco.trim()
  const cci = borrador.cci.replace(/\s/g, '')
  const esCuenta = borrador.tipo === 'cuenta_bancaria'
  const numero = esCuenta ? borrador.numero.trim() : borrador.numero.replace(/\s/g, '')

  if (!titular || titular.length > 80) errores.titular = 'Escribe el nombre del titular.'
  if (esCuenta) {
    if (!/^[0-9][0-9 -]{4,28}[0-9]$/.test(numero))
      errores.numero = 'Escribe el número de cuenta (solo números y guiones).'
    if (!banco || banco.length > 60) errores.banco = 'Escribe el nombre del banco.'
    if (cci && !/^[0-9]{20}$/.test(cci)) errores.cci = 'El CCI tiene 20 dígitos.'
  } else if (!/^9[0-9]{8}$/.test(numero)) {
    errores.numero = 'Escribe el celular de 9 dígitos que empieza con 9.'
  }

  if (Object.keys(errores).length) return { datos: null, errores }
  return {
    datos: {
      tipo: borrador.tipo,
      titular,
      numero,
      banco: esCuenta ? banco : null,
      cci: esCuenta && cci ? cci : null,
    },
    errores,
  }
}

const EXTENSIONES_QR: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}
const MAXIMO_QR = 1024 * 1024

/** Extensión del QR si el archivo es una imagen admitida de hasta 1 MB. */
export function extensionQr(archivo: Pick<File, 'type' | 'size'>): string | null {
  const extension = EXTENSIONES_QR[archivo.type]
  return extension && archivo.size <= MAXIMO_QR ? extension : null
}

export function urlQr(ruta: string, cliente: SupabaseClient = obtenerSupabase()): string {
  return cliente.storage.from('cobros').getPublicUrl(ruta).data.publicUrl
}

const COLUMNAS = 'id,artesano_id,tipo,titular,numero,banco,cci,qr_ruta'

export async function listarMetodosPago(
  artesanoId: string,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<MetodoPago[]> {
  const { data, error } = await cliente
    .from('metodo_pago')
    .select(COLUMNAS)
    .eq('artesano_id', artesanoId)
    .order('creado_en')
  if (error) throw new Error(mensajeError(error))
  return (data ?? []) as MetodoPago[]
}

export async function guardarMetodoPago(
  artesanoId: string,
  datos: DatosMetodoPago,
  qr: File | null,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<MetodoPago> {
  let qrRuta: string | null = null
  if (qr && datos.tipo !== 'cuenta_bancaria') {
    const extension = extensionQr(qr)
    if (!extension) throw new Error('El QR debe ser una imagen PNG, JPG o WebP de hasta 1 MB.')
    qrRuta = `${artesanoId}/qr-${datos.tipo}-${crypto.randomUUID()}.${extension}`
    const { error } = await cliente.storage
      .from('cobros')
      .upload(qrRuta, qr, { contentType: qr.type, upsert: false })
    if (error) throw new Error('No pudimos subir el QR. Revisa tu conexión y reintenta.')
  }
  const { data, error } = await cliente
    .from('metodo_pago')
    .insert({ ...datos, artesano_id: artesanoId, qr_ruta: qrRuta })
    .select(COLUMNAS)
    .single()
  if (error || !data) {
    if (qrRuta) await cliente.storage.from('cobros').remove([qrRuta])
    throw new Error(mensajeError(error))
  }
  return data as MetodoPago
}

export async function borrarMetodoPago(
  metodo: MetodoPago,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<void> {
  const { error } = await cliente.from('metodo_pago').delete().eq('id', metodo.id)
  if (error) throw new Error(mensajeError(error))
  if (metodo.qr_ruta) await cliente.storage.from('cobros').remove([metodo.qr_ruta])
}
