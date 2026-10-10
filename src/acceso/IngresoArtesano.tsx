import { useState, type FormEvent } from 'react'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { ingresarArtesano, type ErrorIngreso } from './sesion'

const URL_WEB = import.meta.env.VITE_WEB_URL as string | undefined
const REGISTRO = URL_WEB ? `${URL_WEB}/artesano/registro` : 'la web de Aylly (/artesano/registro)'

const MENSAJES: Record<ErrorIngreso, string> = {
  credenciales_invalidas: 'Correo o contraseña incorrectos.',
  sin_conexion: 'Necesitas internet para ingresar la primera vez.',
  rol_incorrecto: `Esta app es para artesanos. Regístrate en ${REGISTRO}.`,
  sin_registro: `Aún no completaste tu registro de artesano. Termínalo en ${REGISTRO}.`,
  desconocido: 'No se pudo ingresar. Vuelve a intentarlo.',
}

/** APK: ingreso con el correo de Google y la contraseña elegida al registrarse. */
export function IngresoArtesano({ motivo }: { motivo?: ErrorIngreso }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(motivo ? MENSAJES[motivo] : null)
  const [enCurso, setEnCurso] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnCurso(true)
    setError(null)
    const resultado = await ingresarArtesano(correo, contrasena)
    if (resultado) setError(MENSAJES[resultado])
    setEnCurso(false)
  }

  return (
    <main className="pagina">
      <h1>Ingresa a tu taller</h1>
      <form className="formulario" onSubmit={enviar}>
        <Campo etiqueta="Tu correo de Google">
          {(a) => (
            <input
              {...a}
              type="email"
              autoComplete="username"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          )}
        </Campo>
        <Campo etiqueta="Contraseña">
          {(a) => (
            <input
              {...a}
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          )}
        </Campo>
        {error && <Aviso tono="error">{error}</Aviso>}
        <Boton type="submit" ancho cargando={enCurso}>
          Ingresar
        </Boton>
      </form>
      <p className="nota">
        ¿No tienes cuenta u olvidaste tu contraseña? Entra con Google en{' '}
        {URL_WEB ? <a href={`${URL_WEB}/artesano/registro`}>{REGISTRO}</a> : REGISTRO} y elige una
        nueva.
      </p>
    </main>
  )
}
