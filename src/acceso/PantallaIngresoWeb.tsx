import { useState } from 'react'
import { Aviso, Boton } from '../compartido/ui/componentes'
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
      setError('No se abrió Google. Revisa tu conexión y vuelve a intentarlo.')
      setEnCurso(false)
    }
  }

  return (
    <section className="formulario" aria-labelledby="ingreso-titulo">
      <h1 id="ingreso-titulo">Ingresa para pedir</h1>
      <p>Usa tu cuenta de Google. Así el artesano sabe a quién enviar tu pedido.</p>
      <Boton variante="destacado" onClick={continuar} cargando={enCurso}>
        Continuar con Google
      </Boton>
      {error && <Aviso tono="error">{error}</Aviso>}
    </section>
  )
}
