import { supabase } from '../compartido/supabase'
import { esLugar } from '../compartido/dominio/lugares'

export type Rol = 'comprador' | 'artesano' | 'admin'
export type Acreditacion = 'pendiente' | 'aprobada' | 'rechazada'

/** Fila de `perfil` (docs/contratos.md). */
export interface Perfil {
  id: string
  rol: Rol
  nombre: string
  whatsapp: string | null
  lugar: string | null
  asociacion: string | null
  historia: string | null
  rna_numero: string | null
  acreditacion: Acreditacion | null
  acreditacion_nota: string | null
}

export interface DatosArtesano {
  nombre: string
  whatsapp: string
  lugar: string
  asociacion: string
  historia: string
  rna_numero: string
}

export type ErroresFormulario<T> = Partial<Record<keyof T, string>>

const E164 = /^\+[1-9]\d{7,14}$/
export const LARGO_MINIMO_CONTRASENA = 8

export function validarDatosArtesano(datos: DatosArtesano): ErroresFormulario<DatosArtesano> {
  const errores: ErroresFormulario<DatosArtesano> = {}
  if (!datos.nombre.trim()) errores.nombre = 'Escribe tu nombre.'
  if (!E164.test(datos.whatsapp.trim()))
    errores.whatsapp = 'Escribe tu WhatsApp con código de país, por ejemplo +51987654321.'
  if (!esLugar(datos.lugar)) errores.lugar = 'Elige tu playa o caleta.'
  if (!datos.rna_numero.trim()) errores.rna_numero = 'Escribe tu número de RNA.'
  if (datos.historia.length > 600) errores.historia = 'La historia puede tener hasta 600 letras.'
  if (datos.asociacion.length > 120) errores.asociacion = 'Nombre de asociación muy largo.'
  return errores
}

export function validarContrasena(contrasena: string, confirmacion: string): string | null {
  if (contrasena.length < LARGO_MINIMO_CONTRASENA)
    return `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`
  if (contrasena !== confirmacion) return 'Las contraseñas no coinciden.'
  return null
}

export async function obtenerPerfil(id: string): Promise<Perfil | null> {
  const { data, error } = await supabase.from('perfil').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Perfil | null
}

/** Primer ingreso del comprador en la web: crea su perfil si no existe. */
export async function asegurarPerfilComprador(id: string, nombre: string): Promise<Perfil> {
  const existente = await obtenerPerfil(id)
  if (existente) return existente
  const { data, error } = await supabase
    .from('perfil')
    .insert({ id, rol: 'comprador', nombre: nombre || 'Comprador' })
    .select()
    .single()
  if (error) throw error
  return data as Perfil
}

/**
 * Registro del artesano en la web (CC-03): fija la contraseña sobre la cuenta
 * de Google y crea el perfil pendiente de acreditación.
 */
export async function registrarArtesano(
  id: string,
  datos: DatosArtesano,
  contrasena: string,
): Promise<Perfil> {
  const { error: errorClave } = await supabase.auth.updateUser({ password: contrasena })
  if (errorClave) throw errorClave
  const { data, error } = await supabase
    .from('perfil')
    .insert({
      id,
      rol: 'artesano',
      acreditacion: 'pendiente',
      nombre: datos.nombre.trim(),
      whatsapp: datos.whatsapp.trim(),
      lugar: datos.lugar,
      asociacion: datos.asociacion.trim() || null,
      historia: datos.historia.trim() || null,
      rna_numero: datos.rna_numero.trim(),
    })
    .select()
    .single()
  if (error) throw error
  return data as Perfil
}

export async function listarSolicitudesPendientes(): Promise<Perfil[]> {
  const { data, error } = await supabase
    .from('perfil')
    .select('*')
    .eq('rol', 'artesano')
    .eq('acreditacion', 'pendiente')
    .order('creado_en')
  if (error) throw error
  return (data ?? []) as Perfil[]
}

export const LARGO_MAXIMO_NOTA = 300

/** Solo un admin: la RPC rechaza a cualquier otro usuario con `no_autorizado`. */
export async function resolverAcreditacion(
  id: string,
  acreditacion: 'aprobada' | 'rechazada',
  nota: string | null,
): Promise<void> {
  const { error } = await supabase.rpc('resolver_acreditacion', {
    artesano: id,
    resultado: acreditacion,
    nota,
  })
  if (error) throw error
}

/** Web: el artesano que olvidó su contraseña entra con Google y define otra (CC-03). */
export async function cambiarContrasena(contrasena: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: contrasena })
  if (error) throw error
}
