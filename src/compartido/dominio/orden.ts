// docs/contratos.md §orden, §Datos de envío y §mensaje_orden. Los estados solo
// cambian por RPC (§Transiciones de orden).
export const MODALIDADES = ['recojo', 'envio'] as const
export type Modalidad = (typeof MODALIDADES)[number]

export const ESTADOS_ORDEN = [
  'solicitada',
  'aceptada',
  'rechazada',
  'confirmada',
  'pago_pendiente',
  'pagada',
  'enviada',
  'lista_para_recojo',
  'entregada',
  'cancelada',
] as const
export type EstadoOrden = (typeof ESTADOS_ORDEN)[number]

export type DatosEnvio = {
  nombre_destinatario: string
  telefono: string
  dni: string
  departamento: string
  provincia: string
  distrito: string
  agencia_destino: string
  referencia?: string
}

export type Orden = {
  /** Datos de presentación, devueltos solo a las partes por RPC. */
  nombre_producto?: string | null
  nombre_contraparte?: string | null
  artesano_id?: string

  id: string
  producto_id: string
  comprador_id: string
  cantidad: number
  modalidad: Modalidad
  datos_envio: DatosEnvio | null
  detalle: string | null
  costo_envio: number | null
  total: number | null
  /** Fecha ISO (YYYY-MM-DD). */
  fecha_entrega_estimada: string | null
  enlace_pago: string | null
  numero_guia: string | null
  estado: EstadoOrden
  creado_en: string
  actualizado_en: string
}

export type MensajeOrden = {
  id: string
  orden_id: string
  autor_id: string
  texto_original: string
  /** { "<idioma>": "<texto>" } (CU-08, opcional). */
  texto_traducido: Record<string, string> | null
  creado_en: string
}
