import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Ficha,
  FotoProducto,
  Disponibilidad,
  RevisionIa,
} from '../compartido/dominio/producto'
import type { Acreditacion } from '../acceso/perfil'

export interface DatosValidacionPublicacion {
  ficha: Ficha | null
  precioFinal: number | null
  disponibilidad: Disponibilidad | null
  plazoDias: number | null
  revisionIa: RevisionIa
  acreditacion?: Acreditacion | null
  fotos: FotoProducto[]
}

export interface ResultadoValidacion {
  valido: boolean
  errores: string[]
}

export function validarPublicacion(datos: DatosValidacionPublicacion): ResultadoValidacion {
  const errores: string[] = []

  // 1. Acreditación
  if (datos.acreditacion !== 'aprobada') {
    errores.push('Necesitas tener tu acreditación aprobada por el administrador para publicar.')
  }

  // 2. Revisión IA
  if (datos.revisionIa === 'rechazada') {
    errores.push(
      'No se puede publicar un producto rechazado por la IA. Toma una nueva foto o revisa la pieza.',
    )
  }

  // 3. Precio
  if (
    datos.precioFinal === null ||
    datos.precioFinal === undefined ||
    datos.precioFinal <= 0 ||
    isNaN(datos.precioFinal)
  ) {
    errores.push('El precio final debe ser un número mayor a 0.')
  }

  // 4. Disponibilidad
  if (!datos.disponibilidad) {
    errores.push('Debes seleccionar la disponibilidad (en stock o a pedido).')
  } else if (datos.disponibilidad === 'a_pedido') {
    if (datos.plazoDias === null || datos.plazoDias === undefined || datos.plazoDias <= 0) {
      errores.push('Para productos a pedido, debes especificar un plazo en días mayor a 0.')
    }
  }

  // 5. Fotos
  const fotosPublicadas = datos.fotos.filter((f) => f.publicada)
  if (fotosPublicadas.length === 0) {
    errores.push('Debes marcar al menos una foto para publicar en la vitrina.')
  }

  // 6. Ficha
  if (!datos.ficha) {
    errores.push('El producto debe tener una ficha comercial completa.')
  } else {
    if (!datos.ficha.titulo || datos.ficha.titulo.trim().length === 0) {
      errores.push('El título comercial no puede estar vacío.')
    } else if (datos.ficha.titulo.trim().length > 80) {
      errores.push('El título no puede superar los 80 caracteres.')
    }

    if (!datos.ficha.descripcion || datos.ficha.descripcion.trim().length === 0) {
      errores.push('La descripción no puede estar vacía.')
    }

    if (!datos.ficha.materiales || datos.ficha.materiales.length === 0) {
      errores.push('Debes incluir al menos un material.')
    }

    if (!datos.ficha.tecnica || datos.ficha.tecnica.trim().length === 0) {
      errores.push('La técnica artesanal no puede estar vacía.')
    }

    if (!datos.ficha.tipo_producto) {
      errores.push('Debes seleccionar un tipo de producto.')
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  }
}

export interface DatosEjecucionPublicacion {
  productoId: string
  ficha: Ficha
  precioFinal: number
  disponibilidad: Disponibilidad
  plazoDias: number | null
  fotos: Array<{ id: string; publicada: boolean; posicion: number }>
}

export async function ejecutarPublicacion(
  cliente: SupabaseClient,
  datos: DatosEjecucionPublicacion,
): Promise<{ ok: boolean; error?: string }> {
  // 1. Actualizar fotos
  for (const foto of datos.fotos) {
    const { error: errFoto } = await cliente
      .from('foto_producto')
      .update({
        publicada: foto.publicada,
        posicion: foto.posicion,
      })
      .eq('id', foto.id)
      .eq('producto_id', datos.productoId)

    if (errFoto) {
      return {
        ok: false,
        error: `Error al actualizar fotos: ${errFoto.message}`,
      }
    }
  }

  // 2. Actualizar producto a publicado
  const { error: errProd } = await cliente
    .from('producto')
    .update({
      estado: 'publicado',
      ficha: datos.ficha,
      precio_final: datos.precioFinal,
      disponibilidad: datos.disponibilidad,
      plazo_dias: datos.disponibilidad === 'a_pedido' ? datos.plazoDias : null,
      actualizado_en: new Date().toISOString(),
    })
    .eq('id', datos.productoId)

  if (errProd) {
    return {
      ok: false,
      error: errProd.message,
    }
  }

  return { ok: true }
}
