import { useState, type FormEvent } from 'react'
import { ingresarArtesano, type ErrorIngreso } from './sesion'

const URL_WEB = import.meta.env.VITE_WEB_URL as string | undefined
const REGISTRO = URL_WEB
  ? `${URL_WEB}/artesano/registro`
  : 'la web de CosteARTE (/artesano/registro)'

const MENSAJES: Record<ErrorIngreso, string> = {
  credenciales_invalidas: 'Correo o contraseña incorrectos.',
  sin_conexion: 'Necesitas internet para ingresar la primera vez.',
  rol_incorrecto: `Esta app es para artesanos. Regístrate en ${REGISTRO}.`,
  sin_registro: `Aún no completaste tu registro de artesano. Termínalo en ${REGISTRO}.`,
  desconocido: 'No pudimos ingresar. Inténtalo de nuevo.',
}

/** APK: ingreso con el correo de Google y la contraseña elegida en la web (CC-03). */
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
      <h1>CosteARTE</h1>
      <form className="formulario" onSubmit={enviar}>
        <label className="campo">
          <span>Tu correo de Google</span>
          <input
            type="email"
            autoComplete="username"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </label>
        <label className="campo">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={enCurso}>
          Ingresar
        </button>
      </form>
      <p className="nota">
        ¿No tienes cuenta u olvidaste tu contraseña? Entra con Google en{' '}
        {URL_WEB ? <a href={`${URL_WEB}/artesano/registro`}>{REGISTRO}</a> : REGISTRO} y elige una
        nueva.
      </p>
    </main>
  )
}
