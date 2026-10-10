import { useState, type FormEvent } from 'react'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { crearCuentaConGoogle } from './googleApk'
import { ingresarArtesano, type ErrorIngreso } from './sesion'

export type MotivoIngreso = ErrorIngreso | 'google_fallo'

const MENSAJES: Record<MotivoIngreso, string> = {
  credenciales_invalidas: 'Correo o contraseña incorrectos.',
  sin_conexion: 'Necesitas internet para ingresar o crear tu cuenta.',
  rol_incorrecto:
    'Esta cuenta es de comprador. Para vender, crea tu cuenta con otro correo de Google.',
  sin_registro: 'Aún no completaste tu registro. Entra con Google para terminarlo.',
  google_fallo: 'Google no volvió a la app. Revisa tu conexión y vuelve a intentarlo.',
  desconocido: 'No se pudo ingresar. Vuelve a intentarlo.',
}

/**
 * APK: crear la cuenta con Google (CC-06) o volver a entrar con el correo de
 * Google y la contraseña elegida al registrarse.
 */
export function IngresoArtesano({ motivo }: { motivo?: MotivoIngreso }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(motivo ? MENSAJES[motivo] : null)
  const [enCurso, setEnCurso] = useState<'clave' | 'google' | null>(null)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setEnCurso('clave')
    setError(null)
    const resultado = await ingresarArtesano(correo, contrasena)
    if (resultado) setError(MENSAJES[resultado])
    setEnCurso(null)
  }

  async function crearCuenta() {
    if (!navigator.onLine) return setError(MENSAJES.sin_conexion)
    setEnCurso('google')
    setError(null)
    try {
      await crearCuentaConGoogle()
    } catch {
      setError(MENSAJES.google_fallo)
    } finally {
      setEnCurso(null)
    }
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
        <Boton type="submit" ancho cargando={enCurso === 'clave'} disabled={enCurso === 'google'}>
          Ingresar
        </Boton>
      </form>
      <section className="formulario" aria-labelledby="nueva-cuenta">
        <h2 id="nueva-cuenta">¿Primera vez u olvidaste tu contraseña?</h2>
        <p>
          Entra con Google. La primera vez completas tus datos y eliges una contraseña; si la
          olvidaste, la cambias en «Tu cuenta».
        </p>
        <Boton
          variante="destacado"
          ancho
          onClick={crearCuenta}
          cargando={enCurso === 'google'}
          disabled={enCurso === 'clave'}
        >
          Entrar con Google
        </Boton>
      </section>
    </main>
  )
}
