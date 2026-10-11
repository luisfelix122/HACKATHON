import { useCallback, useEffect, useState } from 'react'
import type { Perfil } from '../compartido/dominio/perfil'
import { obtenerSupabase } from '../compartido/supabase'
import { Aviso, Boton, Campo, Matricula } from '../compartido/ui/componentes'
import { Modal } from '../compartido/ui/Modal'
import './admin.css'

async function leerPendientes(): Promise<Perfil[]> {
  const { data, error } = await obtenerSupabase()
    .from('perfil')
    .select('*')
    .eq('rol', 'artesano')
    .eq('acreditacion', 'pendiente')
    .order('creado_en')
  if (error) throw new Error('No se pudo leer')
  return data as Perfil[]
}

export function PanelAcreditacion() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  // Solicitud abierta en el modal y lo escrito por solicitud: se conserva al cerrar sin enviar.
  const [dialogo, setDialogo] = useState<{ perfil: Perfil; accion: 'aprobar' | 'rechazar' } | null>(
    null,
  )
  const [notas, setNotas] = useState<Record<string, string>>({})
  // Error de la RPC (va en un aviso) y error del motivo (va en el campo), separados.
  const [errorDialogo, setErrorDialogo] = useState<string | null>(null)
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)
  const cargar = useCallback(
    () =>
      leerPendientes()
        .then((data) => {
          setPerfiles(data)
          setError(null)
        })
        .catch(() => {
          setError('No pudimos cargar las solicitudes. Revisa tu conexión y reintenta.')
        })
        .finally(() => {
          setCargando(false)
        }),
    [],
  )
  useEffect(() => {
    void cargar()
  }, [cargar])
  async function resolver(id: string, resultado: 'aprobada' | 'rechazada', nota: string) {
    setErrorDialogo(null)
    setErrorMotivo(null)
    if (resultado === 'rechazada' && !nota.trim()) {
      setErrorMotivo('Escribe el motivo del rechazo.')
      return
    }
    setOcupado(true)
    try {
      const { error: fallo } = await obtenerSupabase().rpc('resolver_acreditacion', {
        artesano: id,
        resultado,
        nota: nota.trim() || null,
      })
      if (fallo) throw new Error()
      setDialogo(null)
      setNotas((previas) => {
        const resto = { ...previas }
        delete resto[id]
        return resto
      })
      await cargar()
    } catch {
      setErrorDialogo(
        'No pudimos resolver la solicitud. Revisa tus permisos y conexión y reintenta.',
      )
    } finally {
      setOcupado(false)
    }
  }
  function abrir(perfil: Perfil, accion: 'aprobar' | 'rechazar') {
    setErrorDialogo(null)
    setErrorMotivo(null)
    setDialogo({ perfil, accion })
  }
  const enDialogo = dialogo?.perfil
  return (
    <main className="pagina admin-acreditacion">
      <header className="admin-cabecera">
        <div>
          <h1>Acreditación RNA</h1>
          <p className="texto-secundario">
            Revisa el RNA declarado antes de aprobar a cada artesano.
          </p>
        </div>
        <Boton
          variante="secundario"
          icono="adelante"
          cargando={cargando || ocupado}
          onClick={() => void cargar()}
        >
          Actualizar solicitudes
        </Boton>
      </header>
      {error && <Aviso tono="error">{error}</Aviso>}
      {/* Si el modal se cerró antes de que respondiera el servidor, el fallo se ve aquí. */}
      {!dialogo && errorDialogo && <Aviso tono="error">{errorDialogo}</Aviso>}
      {cargando ? (
        <Aviso>Cargando solicitudes…</Aviso>
      ) : !error && perfiles.length === 0 ? (
        <Aviso tono="exito">No hay solicitudes pendientes.</Aviso>
      ) : (
        perfiles.length > 0 && (
          <p className="admin-cuenta" role="status">
            {perfiles.length === 1
              ? '1 solicitud pendiente'
              : `${perfiles.length} solicitudes pendientes`}
          </p>
        )
      )}
      <ul className="admin-lista">
        {perfiles.map((perfil) => (
          <li key={perfil.id}>
            <article className="admin-solicitud" aria-labelledby={`solicitud-${perfil.id}`}>
              <header className="admin-solicitud-cabecera">
                <h2 id={`solicitud-${perfil.id}`}>{perfil.nombre}</h2>
                {perfil.lugar && <Matricula>{perfil.lugar}</Matricula>}
              </header>
              <dl className="admin-datos">
                <dt>RNA declarado</dt>
                <dd className="admin-rna">{perfil.rna_numero}</dd>
                <dt>WhatsApp</dt>
                <dd className="cifra">{perfil.whatsapp}</dd>
                <dt>Asociación</dt>
                <dd>{perfil.asociacion || 'Sin asociación'}</dd>
                <dt>Historia</dt>
                <dd>{perfil.historia || 'No la compartió.'}</dd>
              </dl>
              <div className="admin-acciones">
                <Boton icono="exito" onClick={() => abrir(perfil, 'aprobar')}>
                  Aprobar
                </Boton>
                <Boton variante="peligro" icono="cerrar" onClick={() => abrir(perfil, 'rechazar')}>
                  Rechazar
                </Boton>
              </div>
            </article>
          </li>
        ))}
      </ul>
      <Modal
        abierto={dialogo?.accion === 'aprobar'}
        titulo={`Aprobar a ${enDialogo?.nombre ?? ''}`}
        descripcion={`Podrá publicar sus piezas. RNA declarado: ${enDialogo?.rna_numero ?? ''}.`}
        alCerrar={() => setDialogo(null)}
        acciones={
          <>
            <Boton variante="secundario" onClick={() => setDialogo(null)}>
              Cancelar
            </Boton>
            <Boton
              icono="exito"
              cargando={ocupado}
              onClick={() => enDialogo && void resolver(enDialogo.id, 'aprobada', '')}
            >
              Aprobar
            </Boton>
          </>
        }
      >
        {errorDialogo && <Aviso tono="error">{errorDialogo}</Aviso>}
      </Modal>
      <Modal
        abierto={dialogo?.accion === 'rechazar'}
        titulo={`Rechazar a ${enDialogo?.nombre ?? ''}`}
        descripcion="El artesano verá este motivo y podrá corregir su RNA."
        alCerrar={() => setDialogo(null)}
      >
        <form
          className="admin-formulario"
          onSubmit={(evento) => {
            evento.preventDefault()
            if (enDialogo) void resolver(enDialogo.id, 'rechazada', notas[enDialogo.id] ?? '')
          }}
        >
          {errorDialogo && <Aviso tono="error">{errorDialogo}</Aviso>}
          <Campo etiqueta="Motivo del rechazo" error={errorMotivo ?? undefined}>
            {(a) => (
              <textarea
                {...a}
                name="nota"
                maxLength={300}
                required
                value={enDialogo ? (notas[enDialogo.id] ?? '') : ''}
                onChange={(e) => {
                  const texto = e.target.value
                  if (enDialogo) setNotas((previas) => ({ ...previas, [enDialogo.id]: texto }))
                }}
              />
            )}
          </Campo>
          <div className="modal-acciones admin-formulario-acciones">
            <Boton variante="secundario" onClick={() => setDialogo(null)}>
              Cancelar
            </Boton>
            <Boton type="submit" variante="peligro" icono="cerrar" cargando={ocupado}>
              Rechazar
            </Boton>
          </div>
        </form>
      </Modal>
    </main>
  )
}
