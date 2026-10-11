import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ErrorSesion, iniciarSesionGoogle, rutaSegura, useSesion } from './sesion'
import { Aviso, Boton } from './ui/componentes'
import { Icono } from './ui/Icono'

/**
 * /ingresar en la web: ingreso del comprador con Google (§Acceso). Al volver,
 * abre la ruta de origen (`?volver=/producto/x`). El artesano entra por la APK.
 */
export function PantallaIngresoWeb() {
  const [parametros] = useSearchParams()
  const volverA = rutaSegura(parametros.get('volver'))
  const { sesion } = useSesion()
  const [enCurso, setEnCurso] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sesion) return <Navigate to={volverA} replace />

  async function continuar() {
    setEnCurso(true)
    setError(null)
    try {
      await iniciarSesionGoogle(volverA)
      // El navegador sale hacia Google: el botón queda en curso hasta entonces.
    } catch (causa) {
      setError(causa instanceof ErrorSesion ? causa.message : 'No pudimos abrir Google. Reintenta.')
      setEnCurso(false)
    }
  }

  return (
    <main className="pagina pagina-artesano">
      <section className="ingreso-web" aria-labelledby="titulo-ingreso">
        <h1 id="titulo-ingreso">Ingresar</h1>
        <p className="texto-secundario">Necesitas una cuenta para pedir y escribir al artesano.</p>
        <ul className="ingreso-web-lista">
          <li>
            <Icono nombre="pedidos" />
            Pedir piezas con recojo o envío
          </li>
          <li>
            <Icono nombre="mensaje" />
            Hablar con el artesano sobre tu pedido
          </li>
          <li>
            <Icono nombre="envio" />
            Seguir tus pedidos hasta recibirlos
          </li>
        </ul>
        {error && <Aviso tono="error">{error}</Aviso>}
        <Boton variante="destacado" icono="ingresar" ancho cargando={enCurso} onClick={continuar}>
          Continuar con Google
        </Boton>
      </section>
    </main>
  )
}
