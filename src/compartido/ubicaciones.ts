import { z } from 'zod'
import { obtenerSupabase } from './supabase'

export type NivelUbicacion = 'departamento' | 'provincia' | 'distrito'
const ubicacion = z.object({ id: z.string().regex(/^[0-9]{2,6}$/), nombre: z.string().min(1) })
export type Ubicacion = z.infer<typeof ubicacion>

export async function listarUbicaciones(
  nivel: NivelUbicacion,
  padre?: string,
  signal?: AbortSignal,
): Promise<Ubicacion[]> {
  let consulta = obtenerSupabase().from(nivel).select('id,nombre').order('nombre')
  if (nivel !== 'departamento') {
    if (!padre) return []
    consulta = consulta.eq(nivel === 'provincia' ? 'departamento_id' : 'provincia_id', padre)
  }
  if (signal) consulta = consulta.abortSignal(signal)
  const { data, error } = await consulta
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code))
      throw new Error(
        'El catálogo de ubicaciones todavía no está instalado en el servidor. Comunícalo al administrador.',
      )
    if (error.code === '42501')
      throw new Error('El servidor no permite leer las ubicaciones. Comunícalo al administrador.')
    throw new Error('No pudimos cargar las ubicaciones. Revisa tu conexión y reintenta.')
  }
  const opciones = z.array(ubicacion).parse(data)
  if (!opciones.length)
    throw new Error('No hay ubicaciones disponibles para esta selección. Reintenta.')
  return opciones
}
