import { useCallback, useEffect, useState } from 'react'
import {
  LARGO_MAXIMO_NOTA,
  listarSolicitudesPendientes,
  resolverAcreditacion,
  type Perfil,
} from '../acceso/perfil'
import { Aviso, Boton } from '../compartido/ui/componentes'

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
        .catch(() => setError('No se pudieron cargar las solicitudes. Recarga la página.')),
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
      setError('No se pudo guardar. Comprueba que tu cuenta sea de administrador.')
    } finally {
      setEnCurso(null)
    }
  }

  if (!solicitudes)
    return error ? <Aviso tono="error">{error}</Aviso> : <p className="cargando">Cargando…</p>
  if (solicitudes.length === 0)
    return <Aviso tono="exito">No hay solicitudes pendientes. Todo está revisado.</Aviso>

  return (
    <>
      {error && <Aviso tono="error">{error}</Aviso>}
      <ul className="lista">
        {solicitudes.map((s) => (
          <li key={s.id} className="panel">
            <h2>{s.nombre}</h2>
            <dl className="datos">
              <dt>RNA declarado</dt>
              <dd>{s.rna_numero}</dd>
              <dt>Caleta</dt>
              <dd>{s.lugar}</dd>
              {s.asociacion && (
                <>
                  <dt>Asociación</dt>
                  <dd>{s.asociacion}</dd>
                </>
              )}
              <dt>WhatsApp</dt>
              <dd>{s.whatsapp}</dd>
            </dl>
            <div className="acciones">
              <Boton cargando={enCurso === s.id} onClick={() => resolver(s.id, 'aprobada')}>
                Aprobar
              </Boton>
              <Boton
                variante="secundario"
                disabled={enCurso === s.id}
                onClick={() => resolver(s.id, 'rechazada')}
              >
                Rechazar
              </Boton>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
