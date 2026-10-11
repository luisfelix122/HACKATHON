import type { Perfil } from '../compartido/dominio/perfil'
import { Aviso } from '../compartido/ui/componentes'
export function EstadoAcreditacion({ perfil }: { perfil: Perfil }) {
  if (perfil.acreditacion === 'aprobada')
    return <Aviso tono="exito">Tu RNA está aprobado. Ya puedes publicar tus piezas.</Aviso>
  if (perfil.acreditacion === 'rechazada')
    return (
      <Aviso tono="alerta">
        No pudimos aprobar tu RNA. {perfil.acreditacion_nota} Corrige tu número RNA en Tu cuenta
        para solicitar otra revisión.
      </Aviso>
    )
  return (
    <Aviso tono="info">
      Tu acreditación está pendiente. Puedes preparar tus piezas mientras revisamos tu RNA.
    </Aviso>
  )
}
