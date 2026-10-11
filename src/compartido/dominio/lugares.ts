// Lista preliminar de lugares (docs/contratos.md §Convenciones). Debe coincidir con
// el check de perfil.lugar en supabase/migrations/0001_perfil.sql.
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
