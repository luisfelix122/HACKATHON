import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../compartido/sesion'
import { LUGARES } from '../compartido/dominio/lugares'
import type { Perfil } from '../compartido/dominio/perfil'
import { Aviso, Boton, Campo, Casilla } from '../compartido/ui/componentes'
import { guardarPerfil, validarContrasena, validarPerfil } from './perfil'
import { cambiarContrasena, registrarCorreo } from './sesionArtesano'
import { guardarCopia, usePerfil, useSesionApk } from './usePerfil'
import { iniciarGoogleApk } from './googleApk'
import './acceso.css'

export function RegistroArtesano({ cuenta = false }: { cuenta?: boolean }) {
  const { sesion, errorRetorno } = useSesionApk()
  const { perfil, cargando: leyendo } = usePerfil(sesion)
  const navegar = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const datos = new FormData(formulario)
    const password = String(datos.get('password') ?? '')
    const confirmacion = String(datos.get('confirmacion') ?? '')
    setError(null)
    setCargando(true)
    try {
      const entrada = validarPerfil(
        Object.fromEntries(
          ['nombre', 'whatsapp', 'lugar', 'rna_numero', 'asociacion', 'historia'].map((nombre) => [
            nombre,
            String(datos.get(nombre) ?? ''),
          ]),
        ),
      )
      if (!cuenta || password) validarContrasena(password, confirmacion)
      let actual = sesion
      if (!actual)
        actual = await registrarCorreo(String(datos.get('correo')), password, confirmacion)
      else if (!cuenta || password) await cambiarContrasena(password, confirmacion)
      const guardado = await guardarPerfil(actual.user.id, entrada)
      guardarCopia(guardado)
      formulario.reset()
      navegar('/', { replace: true })
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos guardar. Reintenta.')
    } finally {
      setCargando(false)
    }
  }
  async function otraCuenta() {
    setCargando(true)
    setError(null)
    try {
      await cerrarSesion()
      await iniciarGoogleApk()
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos abrir Google.')
    } finally {
      setCargando(false)
    }
  }
  if (cuenta && leyendo)
    return (
      <main className="pagina">
        <p role="status">Leyendo tu cuenta…</p>
      </main>
    )
  if (!cuenta && perfil) return <Navigate to="/" replace />
  const campos: { nombre: keyof Perfil; etiqueta: string; max: number; obligatorio?: boolean }[] = [
    { nombre: 'nombre', etiqueta: 'Nombre', max: 120, obligatorio: true },
    { nombre: 'whatsapp', etiqueta: 'WhatsApp con código de país', max: 16, obligatorio: true },
    { nombre: 'rna_numero', etiqueta: 'Número RNA', max: 40, obligatorio: true },
    { nombre: 'asociacion', etiqueta: 'Asociación (opcional)', max: 120 },
  ]
  return (
    <main className="pagina pagina-artesano acceso">
      <h1>{cuenta ? 'Tu cuenta' : 'Crear tu cuenta de artesano'}</h1>
      {(error || errorRetorno) && <Aviso tono="error">{error ?? errorRetorno}</Aviso>}
      <form
        onSubmit={(evento) => void guardar(evento)}
        className="acceso-formulario"
        key={cuenta ? perfil?.id : 'registro'}
      >
        <Casilla numero={1} titulo="Tu acceso">
          {!sesion && (
            <Campo etiqueta="Correo">
              {(a) => <input {...a} name="correo" type="email" autoComplete="email" required />}
            </Campo>
          )}
          {sesion && <p>{sesion.user.email}</p>}
          <Campo
            etiqueta={cuenta ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            ayuda="Al menos 8 caracteres"
          >
            {(a) => (
              <input
                {...a}
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required={!cuenta}
              />
            )}
          </Campo>
          <Campo etiqueta="Confirmar contraseña">
            {(a) => (
              <input
                {...a}
                name="confirmacion"
                type="password"
                autoComplete="new-password"
                required={!cuenta}
              />
            )}
          </Campo>
        </Casilla>
        <Casilla numero={2} titulo="Tu taller y tu RNA">
          {campos.map((campo) => (
            <Campo key={campo.nombre} etiqueta={campo.etiqueta}>
              {(a) => (
                <input
                  {...a}
                  name={campo.nombre}
                  defaultValue={
                    cuenta
                      ? (perfil?.[campo.nombre] ?? '')
                      : campo.nombre === 'nombre'
                        ? String(sesion?.user.user_metadata.full_name ?? '')
                        : ''
                  }
                  maxLength={campo.max}
                  required={campo.obligatorio}
                />
              )}
            </Campo>
          ))}
          <Campo etiqueta="Lugar">
            {(a) => (
              <select
                {...a}
                name="lugar"
                defaultValue={cuenta ? (perfil?.lugar ?? '') : ''}
                required
              >
                <option value="">Elige tu lugar</option>
                {LUGARES.map((lugar) => (
                  <option key={lugar}>{lugar}</option>
                ))}
              </select>
            )}
          </Campo>
          <Campo etiqueta="Historia (opcional)" ayuda="Hasta 600 caracteres">
            {(a) => (
              <textarea
                {...a}
                name="historia"
                maxLength={600}
                defaultValue={cuenta ? (perfil?.historia ?? '') : ''}
              />
            )}
          </Campo>
        </Casilla>
        <Boton type="submit" variante="destacado" cargando={cargando}>
          {cuenta ? 'Guardar cambios' : 'Enviar solicitud de acreditación'}
        </Boton>
      </form>
      {cuenta && (
        <Boton
          variante="secundario"
          cargando={cargando}
          onClick={async () => {
            setCargando(true)
            try {
              await cerrarSesion()
              navegar('/ingresar', { replace: true })
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error al cerrar sesión')
            } finally {
              setCargando(false)
            }
          }}
        >
          Cerrar sesión
        </Boton>
      )}
      {!cuenta && sesion && (
        <Boton variante="secundario" cargando={cargando} onClick={() => void otraCuenta()}>
          Usar otra cuenta de Google
        </Boton>
      )}
      <Link to={cuenta ? '/' : '/ingresar'}>
        {cuenta ? 'Volver a Mis productos' : 'Ya tengo cuenta'}
      </Link>
    </main>
  )
}
