import { useState, type FormEvent } from 'react'
import { LUGARES } from '../compartido/dominio/lugares'
import { EstadoAcreditacion } from './EstadoAcreditacion'
import {
  cambiarContrasena,
  registrarArtesano,
  validarContrasena,
  validarDatosArtesano,
  type DatosArtesano,
  type ErroresFormulario,
  type Perfil,
} from './perfil'
import { ingresarConGoogle, useSesion } from './sesion'
import { usePerfil } from './usePerfil'

const VACIO: DatosArtesano = {
  nombre: '',
  whatsapp: '+51',
  lugar: '',
  asociacion: '',
  historia: '',
  rna_numero: '',
}

/** Web `/artesano/registro` (CC-03): Google → contraseña → perfil pendiente. */
export function RegistroArtesano() {
  const sesion = useSesion()
  const { perfil, cargando, recargar } = usePerfil(sesion?.user.id)

  if (sesion === undefined || cargando) return <p className="pagina">Cargando…</p>

  if (!sesion) {
    return (
      <main className="pagina">
        <h1>Registro de artesanos</h1>
        <p>Primero crea tu cuenta con Google. Después elegirás la contraseña para la app.</p>
        <button onClick={() => ingresarConGoogle('/artesano/registro')}>
          Continuar con Google
        </button>
      </main>
    )
  }

  if (perfil) return <RegistroTerminado perfil={perfil} />

  return (
    <FormularioArtesano
      id={sesion.user.id}
      correo={sesion.user.email ?? ''}
      nombreInicial={(sesion.user.user_metadata?.full_name as string | undefined) ?? ''}
      alTerminar={recargar}
    />
  )
}

function RegistroTerminado({ perfil }: { perfil: Perfil }) {
  if (perfil.rol !== 'artesano') {
    return (
      <main className="pagina">
        <p>Esta cuenta ya está registrada como {perfil.rol}. Usa otra cuenta de Google.</p>
      </main>
    )
  }
  return (
    <main className="pagina">
      <h1>¡Listo, {perfil.nombre}!</h1>
      <EstadoAcreditacion perfil={perfil} />
      <p>Abre la app CosteARTE en tu celular e ingresa con tu correo y tu contraseña.</p>
      <NuevaContrasena />
    </main>
  )
}

/** Para el artesano que olvidó su contraseña: ya entró con Google y define otra. */
function NuevaContrasena() {
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
      setMensaje({ texto: 'Contraseña actualizada. Úsala en la app.', error: false })
      setContrasena('')
      setConfirmacion('')
    } catch {
      setMensaje({ texto: 'No pudimos cambiar la contraseña. Inténtalo de nuevo.', error: true })
    } finally {
      setEnCurso(false)
    }
  }

  return (
    <form className="formulario tarjeta" onSubmit={enviar} noValidate>
      <h2>¿Olvidaste tu contraseña?</h2>
      <Campo etiqueta="Nueva contraseña (mínimo 8)">
        <input
          type="password"
          autoComplete="new-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
      </Campo>
      <Campo etiqueta="Repite la contraseña">
        <input
          type="password"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
        />
      </Campo>
      {mensaje && <p className={mensaje.error ? 'error' : 'nota'}>{mensaje.texto}</p>}
      <button type="submit" disabled={enCurso}>
        Guardar contraseña
      </button>
    </form>
  )
}

function FormularioArtesano(props: {
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
      setErrorGeneral('No pudimos guardar tu registro. Inténtalo de nuevo.')
    } finally {
      setEnCurso(false)
    }
  }

  return (
    <main className="pagina">
      <h1>Registro de artesanos</h1>
      <p>
        Tu usuario para la app será <strong>{props.correo}</strong>.
      </p>
      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo etiqueta="Tu nombre" error={errores.nombre}>
          <input value={datos.nombre} onChange={(e) => cambiar('nombre')(e.target.value)} />
        </Campo>
        <Campo etiqueta="WhatsApp (con +51)" error={errores.whatsapp}>
          <input
            inputMode="tel"
            value={datos.whatsapp}
            onChange={(e) => cambiar('whatsapp')(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Playa o caleta" error={errores.lugar}>
          <select value={datos.lugar} onChange={(e) => cambiar('lugar')(e.target.value)}>
            <option value="">Elige una</option>
            {LUGARES.map((lugar) => (
              <option key={lugar}>{lugar}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Asociación (opcional)" error={errores.asociacion}>
          <input value={datos.asociacion} onChange={(e) => cambiar('asociacion')(e.target.value)} />
        </Campo>
        <Campo etiqueta="Número de RNA" error={errores.rna_numero}>
          <input value={datos.rna_numero} onChange={(e) => cambiar('rna_numero')(e.target.value)} />
        </Campo>
        <Campo etiqueta="Tu historia (opcional)" error={errores.historia}>
          <textarea
            rows={4}
            maxLength={600}
            value={datos.historia}
            onChange={(e) => cambiar('historia')(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Contraseña para la app (mínimo 8)" error={errorClave ?? undefined}>
          <input
            type="password"
            autoComplete="new-password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Repite la contraseña">
          <input
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
          />
        </Campo>
        {errorGeneral && <p className="error">{errorGeneral}</p>}
        <button type="submit" disabled={enCurso}>
          Enviar solicitud
        </button>
      </form>
    </main>
  )
}

function Campo(props: { etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="campo">
      <span>{props.etiqueta}</span>
      {props.children}
      {props.error && <span className="error">{props.error}</span>}
    </label>
  )
}
