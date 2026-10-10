/**
 * Lista preliminar de lugares (docs/contratos.md §Convenciones). Pendiente de
 * confirmar con La Vaca Loca. Debe coincidir con el check de
 * supabase/migrations/0001_perfil.sql.
 */
export const LUGARES = [
  'Máncora',
  'Lobitos',
  'Cabo Blanco',
  'El Ñuro',
  'Los Órganos',
  'El Alto',
  'Pariñas',
  'Colán',
  'Punta Sal',
] as const

export type Lugar = (typeof LUGARES)[number]

export function esLugar(valor: string): valor is Lugar {
  return (LUGARES as readonly string[]).includes(valor)
}
