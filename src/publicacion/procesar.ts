import type { SupabaseClient } from '@supabase/supabase-js'
import { obtenerSupabase } from '../compartido/supabase'
import type { Ficha, VarianteFoto } from '../compartido/dominio/producto'

export interface ErrorProcesamiento {
  error: string
  mensaje: string
  status?: number
}

export interface FotoIaGenerada {
  id: string
  variante: VarianteFoto
  ruta: string
}

export interface RespuestaProcesarProducto {
  estado: 'en_revision'
  ficha: Ficha
  evaluacion: {
    es_artesania: boolean
    contenido_apropiado: boolean
    motivo: string
  }
  comentario_precio: string
  fotos_ia: FotoIaGenerada[]
  advertencias: string[]
}

export type ResultadoProcesar =
  { ok: true; datos: RespuestaProcesarProducto } | { ok: false; error: ErrorProcesamiento }

/**
 * Invoca la Edge Function `procesar-producto` y procesa las respuestas según el contrato (docs/contratos.md).
 * Maneja los errores 400, 401, 403, 409, 422 (no_es_artesania, contenido_no_permitido), 429 y 502.
 */
export async function procesarProductoConIa(
  productoId: string,
  mejorarFoto = true,
  cliente: SupabaseClient = obtenerSupabase(),
): Promise<ResultadoProcesar> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      error: {
        error: 'sin_conexion',
        mensaje: 'Sin conexión a internet. Revisa tu señal para preparar con IA.',
      },
    }
  }

  try {
    const { data, error } = await cliente.functions.invoke('procesar-producto', {
      body: {
        producto_id: productoId,
        mejorar_foto: mejorarFoto,
      },
    })

    if (error) {
      let cuerpoError: { error?: string; mensaje?: string } | null = null
      if (
        'context' in error &&
        error.context &&
        typeof (error.context as Response).clone === 'function'
      ) {
        try {
          cuerpoError = await (error.context as Response).clone().json()
        } catch {
          // Fallback a mensaje estándar
        }
      }

      const codigo = cuerpoError?.error || 'ia_no_disponible'
      let mensaje = cuerpoError?.mensaje || error.message

      if (codigo === 'no_es_artesania') {
        mensaje =
          cuerpoError?.mensaje ||
          'Esta pieza parece industrial. Si la hiciste tú, toma otra foto que muestre el trabajo a mano.'
      } else if (codigo === 'contenido_no_permitido') {
        mensaje = cuerpoError?.mensaje || 'La foto o descripción contiene material inapropiado.'
      } else if (codigo === 'limite_ia') {
        mensaje = 'Se superó el límite de intentos con IA para este producto.'
      } else if (codigo === 'ia_no_disponible') {
        mensaje = 'No pudimos preparar tu producto. Puedes reintentar o completarlo a mano.'
      }

      return {
        ok: false,
        error: {
          error: codigo,
          mensaje,
        },
      }
    }

    return {
      ok: true,
      datos: data as RespuestaProcesarProducto,
    }
  } catch (err) {
    return {
      ok: false,
      error: {
        error: 'ia_no_disponible',
        mensaje:
          err instanceof Error
            ? err.message
            : 'No pudimos preparar tu producto. Puedes reintentar o completarlo a mano.',
      },
    }
  }
}

/**
 * Escucha la recuperación de red para reintentar automáticamente cuando vuelva la conexión.
 */
export function suscribirReintentoOnline(accion: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }
  const handler = () => {
    accion()
  }
  window.addEventListener('online', handler)
  return () => {
    window.removeEventListener('online', handler)
  }
}
