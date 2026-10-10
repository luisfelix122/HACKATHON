import { Aviso, SelloRna } from '../compartido/ui/componentes'
import type { Perfil } from './perfil'

/** Estado del RNA del artesano: sello y qué puede hacer ahora. */
export function EstadoAcreditacion({ perfil }: { perfil: Perfil }) {
  switch (perfil.acreditacion) {
    case 'aprobada':
      return (
        <div className="acciones" style={{ alignItems: 'center' }}>
          <SelloRna estado="aprobada" />
          <p>Tu RNA está verificado. Ya puedes publicar tus productos.</p>
        </div>
      )
    case 'pendiente':
      return (
        <div className="acciones" style={{ alignItems: 'center' }}>
          <SelloRna estado="pendiente" />
          <p>Estamos revisando tu RNA. Mientras tanto puedes crear borradores, pero no publicar.</p>
        </div>
      )
    case 'rechazada':
      return (
        <Aviso tono="alerta">
          Tu solicitud fue rechazada.
          {perfil.acreditacion_nota && <> Motivo: {perfil.acreditacion_nota}</>} Corrige tu número
          de RNA para que la revisemos otra vez.
        </Aviso>
      )
    default:
      return null
  }
}
