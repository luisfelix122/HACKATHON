import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { Modal } from '../compartido/ui/Modal'
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
  const [ayuda, setAyuda] = useState(false)
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
      <header className="acceso-cabecera">
        <h1>Entrar a Ayllu</h1>
        <p className="texto-secundario">Tu taller, tus piezas y tus pedidos.</p>
      </header>
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
        <Boton type="submit" variante="destacado" icono="ingresar" ancho cargando={cargando}>
          Entrar
        </Boton>
        <button type="button" className="acceso-enlace" onClick={() => setAyuda(true)}>
          ¿Olvidaste tu contraseña?
        </button>
      </form>
      <div className="acceso-separador" role="presentation">
        <span>o</span>
      </div>
      <Boton
        variante="secundario"
        icono="cuenta"
        ancho
        cargando={cargando}
        onClick={() => void google()}
      >
        Entrar con Google
      </Boton>
      <Link className="boton boton-secundario boton-ancho" to="/registro">
        <Icono nombre="nuevo" />
        Crear cuenta con correo
      </Link>
      <Modal
        abierto={ayuda}
        titulo="¿Olvidaste tu contraseña?"
        alCerrar={() => setAyuda(false)}
        acciones={
          <Boton variante="secundario" onClick={() => setAyuda(false)}>
            Entendido
          </Boton>
        }
      >
        <p>
          Si tu correo es de Google, entra con Google y cambia la contraseña en Tu cuenta. Si no,
          pide al administrador que la restablezca.
        </p>
      </Modal>
    </main>
  )
}
