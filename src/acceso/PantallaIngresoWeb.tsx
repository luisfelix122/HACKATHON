import { useState } from 'react'
import { ingresarConGoogle } from './sesion'

/** Ingreso del comprador en la web. */
export function PantallaIngresoWeb({ rutaRetorno = '/' }: { rutaRetorno?: string }) {
  const [error, setError] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState(false)

  async function continuar() {
    setEnCurso(true)
    setError(null)
    try {
      await ingresarConGoogle(rutaRetorno)
    } catch {
      setError('No pudimos abrir Google. Revisa tu conexión e inténtalo de nuevo.')
      setEnCurso(false)
    }
  }

  return (
    <section className="tarjeta">
      <h2>Ingresa para pedir</h2>
      <button onClick={continuar} disabled={enCurso}>
        Continuar con Google
      </button>
      {error && <p className="error">{error}</p>}
    </section>
  )
}
