import type { Perfil } from './perfil'

const TEXTOS = {
  pendiente: 'Tu RNA está en revisión. Puedes crear borradores, pero aún no publicar.',
  aprobada: 'RNA verificado. Ya puedes publicar tus productos.',
  rechazada: 'Tu solicitud fue rechazada.',
} as const

export function EstadoAcreditacion({ perfil }: { perfil: Perfil }) {
  if (!perfil.acreditacion) return null
  return (
    <p className={`aviso aviso-${perfil.acreditacion}`} role="status">
      {TEXTOS[perfil.acreditacion]}
      {perfil.acreditacion === 'rechazada' && perfil.acreditacion_nota && (
        <> Motivo: {perfil.acreditacion_nota}</>
      )}
    </p>
  )
}
