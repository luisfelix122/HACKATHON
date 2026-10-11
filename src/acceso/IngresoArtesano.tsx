import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { ingresarArtesano } from './sesionArtesano'
import { iniciarGoogleApk } from './googleApk'
import { guardarCopia, useSesionApk } from './usePerfil'
import './acceso.css'

export function IngresoArtesano() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const { sesion, cargando: leyendo, errorRetorno } = useSesionApk()
  const [error, setError] = useState<string | null>(() => {
    const estado = ubicacion.state as { error?: unknown } | null
    return typeof estado?.error === 'string' ? estado.error : null
  })
  const [cargando, setCargando] = useState(false)
  useEffect(() => {
    if (sesion && !leyendo && !cargando) navegar('/', { replace: true })
  }, [sesion, leyendo, cargando, navegar])
  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    setCargando(true)
    setError(null)
    try {
      const perfil = await ingresarArtesano(
        String(datos.get('correo')),
        String(datos.get('password')),
      )
      formulario.reset()
      if (perfil) guardarCopia(perfil)
      navegar(perfil ? '/' : '/registro', { replace: true })
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos entrar. Reintenta.')
    } finally {
      setCargando(false)
    }
  }
  async function google() {
    setCargando(true)
    setError(null)
    try {
      await iniciarGoogleApk()
      navegar('/', { replace: true })
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos abrir Google.')
    } finally {
      setCargando(false)
    }
  }
  return (
    <main className="pagina pagina-artesano acceso">
      <h1>Entrar a Ayllu</h1>
      <p>Tu taller, tus piezas y tus pedidos.</p>
      {(error || errorRetorno) && <Aviso tono="error">{error ?? errorRetorno}</Aviso>}
      <form onSubmit={(evento) => void entrar(evento)} className="acceso-formulario">
        <Campo etiqueta="Correo">
          {(atributos) => (
            <input {...atributos} name="correo" type="email" autoComplete="username" required />
          )}
        </Campo>
        <Campo etiqueta="Contraseña">
          {(atributos) => (
            <input
              {...atributos}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          )}
        </Campo>
        <Boton type="submit" variante="destacado" cargando={cargando}>
          Entrar
        </Boton>
      </form>
      <details>
        <summary>¿Olvidaste tu contraseña?</summary>
        <p>
          Si tu correo es de Google, entra con Google y cambia la contraseña en Tu cuenta. Si no,
          pide al administrador que la restablezca.
        </p>
      </details>
      <Boton variante="secundario" cargando={cargando} onClick={() => void google()}>
        Entrar con Google
      </Boton>
      <Link to="/registro">Crear cuenta con correo</Link>
    </main>
  )
}
