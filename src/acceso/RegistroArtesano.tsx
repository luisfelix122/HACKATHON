import { useState, type FormEvent } from 'react'
import { LUGARES } from '../compartido/dominio/lugares'
import { Aviso, Boton, Campo, Casilla } from '../compartido/ui/componentes'
import {
  cambiarContrasena,
  registrarArtesano,
  validarContrasena,
  validarDatosArtesano,
  type DatosArtesano,
  type ErroresFormulario,
} from './perfil'

const VACIO: DatosArtesano = {
  nombre: '',
  whatsapp: '+51',
  lugar: '',
  asociacion: '',
  historia: '',
  rna_numero: '',
}

/**
 * Registro y cuenta del artesano, solo en la APK (CC-08): formulario inicial
 * tras crear la cuenta con Google y cambio de contraseña dentro de la app.
 */

/** Para el artesano que olvidó su contraseña: entró con Google y define otra. */
export function NuevaContrasena() {
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null)
  const [enCurso, setEnCurso] = useState(false)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const error = validarContrasena(contrasena, confirmacion)
    if (error) return setMensaje({ texto: error, error: true })
    setEnCurso(true)
    try {
      await cambiarContrasena(contrasena)
      setMensaje({ texto: 'Contraseña cambiada. Úsala en la app.', error: false })
      setContrasena('')
      setConfirmacion('')
    } catch {
      setMensaje({ texto: 'No se pudo cambiar la contraseña. Vuelve a intentarlo.', error: true })
    } finally {
      setEnCurso(false)
    }
  }

  return (
    <form className="formulario panel" onSubmit={enviar} noValidate>
      <h2>Cambiar tu contraseña</h2>
      <Campo etiqueta="Nueva contraseña" ayuda="Mínimo 8 caracteres.">
        {(a) => (
          <input
            {...a}
            type="password"
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        )}
      </Campo>
      <Campo etiqueta="Repite la contraseña">
        {(a) => (
          <input
            {...a}
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />
        )}
      </Campo>
      {mensaje && <Aviso tono={mensaje.error ? 'error' : 'exito'}>{mensaje.texto}</Aviso>}
      <Boton type="submit" cargando={enCurso}>
        Cambiar contraseña
      </Boton>
    </form>
  )
}

/** Formulario de registro del artesano en la APK, tras crear la cuenta con Google. */
export function FormularioArtesano(props: {
  id: string
  correo: string
  nombreInicial: string
  alTerminar: () => void
}) {
  const [datos, setDatos] = useState<DatosArtesano>({ ...VACIO, nombre: props.nombreInicial })
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<ErroresFormulario<DatosArtesano>>({})
  const [errorClave, setErrorClave] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState(false)

  const cambiar = (campo: keyof DatosArtesano) => (valor: string) =>
    setDatos((previo) => ({ ...previo, [campo]: valor }))

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const nuevosErrores = validarDatosArtesano(datos)
    const nuevoErrorClave = validarContrasena(contrasena, confirmacion)
    setErrores(nuevosErrores)
    setErrorClave(nuevoErrorClave)
    if (Object.keys(nuevosErrores).length > 0 || nuevoErrorClave) return

    setEnCurso(true)
    setErrorGeneral(null)
    try {
      await registrarArtesano(props.id, datos, contrasena)
      props.alTerminar()
    } catch {
      setErrorGeneral('No se pudo guardar tu registro. Vuelve a intentarlo.')
    } finally {
      setEnCurso(false)
    }
  }

  return (
    <main className="pagina">
      <h1>Tu guía de artesano</h1>
      <p>
        Tu usuario para la app será <strong>{props.correo}</strong>. Completa las cuatro casillas.
      </p>
      <form className="formulario" onSubmit={enviar} noValidate>
        <Casilla numero={1}>
          <Campo etiqueta="Tu nombre" error={errores.nombre}>
            {(a) => (
              <input
                {...a}
                value={datos.nombre}
                onChange={(e) => cambiar('nombre')(e.target.value)}
              />
            )}
          </Campo>
          <Campo
            etiqueta="Tu WhatsApp"
            ayuda="Con +51, por ejemplo +51987654321."
            error={errores.whatsapp}
          >
            {(a) => (
              <input
                {...a}
                inputMode="tel"
                value={datos.whatsapp}
                onChange={(e) => cambiar('whatsapp')(e.target.value)}
              />
            )}
          </Campo>
        </Casilla>
        <Casilla numero={2}>
          <Campo etiqueta="Tu playa o caleta" error={errores.lugar}>
            {(a) => (
              <select {...a} value={datos.lugar} onChange={(e) => cambiar('lugar')(e.target.value)}>
                <option value="">Elige una</option>
                {LUGARES.map((lugar) => (
                  <option key={lugar}>{lugar}</option>
                ))}
              </select>
            )}
          </Campo>
          <Campo
            etiqueta="Tu asociación"
            ayuda="Si no perteneces a una, déjalo vacío."
            error={errores.asociacion}
          >
            {(a) => (
              <input
                {...a}
                value={datos.asociacion}
                onChange={(e) => cambiar('asociacion')(e.target.value)}
              />
            )}
          </Campo>
        </Casilla>
        <Casilla numero={3}>
          <Campo
            etiqueta="Tu número de RNA"
            ayuda="Registro Nacional del Artesano. Lo revisamos antes de que publiques."
            error={errores.rna_numero}
          >
            {(a) => (
              <input
                {...a}
                value={datos.rna_numero}
                onChange={(e) => cambiar('rna_numero')(e.target.value)}
              />
            )}
          </Campo>
          <Campo
            etiqueta="Tu historia"
            ayuda="Opcional. Cuenta qué haces y desde cuándo (hasta 600 letras)."
            error={errores.historia}
          >
            {(a) => (
              <textarea
                {...a}
                rows={4}
                maxLength={600}
                value={datos.historia}
                onChange={(e) => cambiar('historia')(e.target.value)}
              />
            )}
          </Campo>
        </Casilla>
        <Casilla numero={4}>
          <Campo
            etiqueta="Contraseña para la app"
            ayuda="Mínimo 8 caracteres."
            error={errorClave ?? undefined}
          >
            {(a) => (
              <input
                {...a}
                type="password"
                autoComplete="new-password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Repite la contraseña">
            {(a) => (
              <input
                {...a}
                type="password"
                autoComplete="new-password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            )}
          </Campo>
        </Casilla>
        {errorGeneral && <Aviso tono="error">{errorGeneral}</Aviso>}
        <Boton type="submit" variante="destacado" cargando={enCurso}>
          Enviar mi solicitud
        </Boton>
      </form>
    </main>
  )
}
