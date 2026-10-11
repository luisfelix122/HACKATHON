import { useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { iniciarSesionGoogle, useSesion } from '../compartido/sesion'
import { Aviso, Boton } from '../compartido/ui/componentes'
import { FormularioPedido } from './FormularioPedido'
import './pedidos.css'

export function BotonPedir({ productoId }: { productoId: string }) {
  const { sesion, cargando } = useSesion()
  const ubicacion = useLocation()
  const [parametros, setParametros] = useSearchParams()
  const [ingresando, setIngresando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bloqueo = useRef(false)
  const abierto = parametros.get('pedir') === productoId
  async function pedir() {
    if (bloqueo.current || cargando) return
    setError(null)
    const nuevos = new URLSearchParams(parametros)
    nuevos.set('pedir', productoId)
    if (sesion) {
      setParametros(nuevos, { replace: true })
      return
    }
    bloqueo.current = true
    setIngresando(true)
    try {
      await iniciarSesionGoogle(`${ubicacion.pathname}?${nuevos.toString()}`)
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos ingresar. Reintenta.')
    } finally {
      bloqueo.current = false
      setIngresando(false)
    }
  }
  function cerrar() {
    const nuevos = new URLSearchParams(parametros)
    nuevos.delete('pedir')
    setParametros(nuevos, { replace: true })
  }
  return (
    <div className="boton-pedir" data-producto-id={productoId}>
      <Boton
        variante="destacado"
        icono="pedidos"
        disabled={cargando}
        cargando={ingresando}
        onClick={() => void pedir()}
      >
        Pedir
      </Boton>
      {error && <Aviso tono="error">{error}</Aviso>}
      <p className="boton-pedir-nota texto-secundario">
        ¿Ya pediste? Revisa <Link to="/pedidos">Mis pedidos</Link>.
      </p>
      {sesion && (
        <FormularioPedido
          key={productoId}
          productoId={productoId}
          alCerrar={cerrar}
          abierto={abierto}
        />
      )}
    </div>
  )
}
