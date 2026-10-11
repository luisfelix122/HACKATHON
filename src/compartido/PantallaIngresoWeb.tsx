import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ErrorSesion, iniciarSesionGoogle, rutaSegura, useSesion } from './sesion'
import { Aviso, Boton } from './ui/componentes'

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
      <h1>Ingresar</h1>
      <p className="texto-secundario">Necesitas una cuenta para pedir y escribir al artesano.</p>
      {error && <Aviso tono="error">{error}</Aviso>}
      <p>
        <Boton variante="destacado" cargando={enCurso} onClick={continuar}>
          Continuar con Google
        </Boton>
      </p>
    </main>
  )
}
