import { useCallback, useEffect, useState } from 'react'
import type { Perfil } from '../compartido/dominio/perfil'
import { obtenerSupabase } from '../compartido/supabase'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
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
    setError(null)
    if (resultado === 'rechazada' && !nota.trim()) {
      setError('Escribe el motivo del rechazo.')
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
      await cargar()
    } catch {
      setError('No pudimos resolver la solicitud. Revisa tus permisos y conexión y reintenta.')
    } finally {
      setOcupado(false)
    }
  }
  return (
    <main className="pagina admin-acreditacion">
      <h1>Acreditación RNA</h1>
      <p>Revisa el RNA declarado antes de aprobar a cada artesano.</p>
      {error && <Aviso tono="error">{error}</Aviso>}
      <Boton variante="secundario" cargando={cargando || ocupado} onClick={() => void cargar()}>
        Actualizar solicitudes
      </Boton>
      {cargando ? (
        <p role="status">Cargando solicitudes…</p>
      ) : !error && perfiles.length === 0 ? (
        <p>No hay solicitudes pendientes.</p>
      ) : null}
      {perfiles.map((perfil) => (
        <form
          key={perfil.id}
          className="admin-solicitud"
          onSubmit={(evento) => {
            evento.preventDefault()
            const datos = new FormData(evento.currentTarget)
            void resolver(perfil.id, 'rechazada', String(datos.get('nota') ?? ''))
          }}
        >
          <h2>{perfil.nombre}</h2>
          <p>
            {perfil.lugar} · RNA: {perfil.rna_numero}
          </p>
          <p>WhatsApp: {perfil.whatsapp}</p>
          <p>{perfil.asociacion}</p>
          <p>{perfil.historia}</p>
          <Campo etiqueta="Motivo del rechazo">
            {(a) => <textarea {...a} name="nota" maxLength={300} required />}
          </Campo>
          <div className="admin-acciones">
            <Boton cargando={ocupado} onClick={() => void resolver(perfil.id, 'aprobada', '')}>
              Aprobar
            </Boton>
            <Boton type="submit" variante="secundario" cargando={ocupado}>
              Rechazar
            </Boton>
          </div>
        </form>
      ))}
    </main>
  )
}
