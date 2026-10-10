import { useCallback, useEffect, useState } from 'react'
import {
  LARGO_MAXIMO_NOTA,
  listarSolicitudesPendientes,
  resolverAcreditacion,
  type Perfil,
} from '../acceso/perfil'

/** Web `/admin`: revisión manual del RNA declarado. */
export function PanelAcreditacion() {
  const [solicitudes, setSolicitudes] = useState<Perfil[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState<string | null>(null)

  const cargar = useCallback(
    () =>
      listarSolicitudesPendientes()
        .then((lista) => {
          setSolicitudes(lista)
          setError(null)
        })
        .catch(() => setError('No pudimos cargar las solicitudes.')),
    [],
  )

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function resolver(id: string, resultado: 'aprobada' | 'rechazada') {
    const nota =
      resultado === 'rechazada' ? window.prompt('Motivo del rechazo (lo verá el artesano):') : null
    if (resultado === 'rechazada' && !nota?.trim()) return
    if (nota && nota.length > LARGO_MAXIMO_NOTA) {
      setError(`El motivo puede tener hasta ${LARGO_MAXIMO_NOTA} caracteres.`)
      return
    }
    setEnCurso(id)
    try {
      await resolverAcreditacion(id, resultado, nota)
      cargar()
    } catch {
      setError('No se pudo guardar. ¿Tu cuenta es de administrador?')
    } finally {
      setEnCurso(null)
    }
  }

  if (!solicitudes) return error ? <p className="error">{error}</p> : <p>Cargando…</p>
  if (solicitudes.length === 0) return <p>No hay solicitudes pendientes.</p>

  return (
    <>
      {error && <p className="error">{error}</p>}
      <ListaSolicitudes solicitudes={solicitudes} enCurso={enCurso} resolver={resolver} />
    </>
  )
}

function ListaSolicitudes(props: {
  solicitudes: Perfil[]
  enCurso: string | null
  resolver: (id: string, resultado: 'aprobada' | 'rechazada') => void
}) {
  const { solicitudes, enCurso, resolver } = props
  return (
    <ul className="lista">
      {solicitudes.map((s) => (
        <li key={s.id} className="tarjeta">
          <h2>{s.nombre}</h2>
          <p>
            RNA: <strong>{s.rna_numero}</strong> · {s.lugar}
            {s.asociacion && ` · ${s.asociacion}`}
          </p>
          <p>WhatsApp: {s.whatsapp}</p>
          <div className="acciones">
            <button disabled={enCurso === s.id} onClick={() => resolver(s.id, 'aprobada')}>
              Aprobar
            </button>
            <button
              className="secundario"
              disabled={enCurso === s.id}
              onClick={() => resolver(s.id, 'rechazada')}
            >
              Rechazar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
