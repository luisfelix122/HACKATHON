import type { Lugar } from './lugares'

// docs/contratos.md §perfil. Nombres del glosario (docs/dominio.md), sin sinónimos.
export const ROLES = ['comprador', 'artesano', 'admin'] as const
export type Rol = (typeof ROLES)[number]

export const ACREDITACIONES = ['pendiente', 'aprobada', 'rechazada'] as const
export type Acreditacion = (typeof ACREDITACIONES)[number]

export type Perfil = {
  id: string
  rol: Rol
  nombre: string
  whatsapp: string | null
  lugar: Lugar | null
  asociacion: string | null
  historia: string | null
  rna_numero: string | null
  acreditacion: Acreditacion | null
  acreditacion_nota: string | null
  creado_en: string
}

/** Campos públicos de un artesano aprobado (vista artesano_publico). */
export type ArtesanoPublico = Pick<Perfil, 'id' | 'nombre' | 'asociacion' | 'historia'> & {
  lugar: Lugar
  whatsapp: string
}
