import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Boton, SelloRna } from '../compartido/ui/componentes'
import { consultarArtesano, useConsulta } from './consultas'
import { Catalogo } from './Catalogo'

export function PerfilArtesano() {
  const { id = '' } = useParams()
  const cargar = useCallback(() => consultarArtesano(id), [id])
  const { datos, error, reintentar } = useConsulta(cargar)
  if (error)
    return (
      <main className="pagina vitrina">
        <h1>No pudimos cargar el perfil</h1>
        <Aviso tono="error">Revisa tu conexión y reintenta.</Aviso>
        <Boton onClick={reintentar}>Reintentar</Boton>
      </main>
    )
  if (datos === undefined)
    return (
      <main className="pagina">
        <Aviso>Cargando perfil…</Aviso>
      </main>
    )
  if (!datos)
    return (
      <main className="pagina vitrina">
        <h1>Artesano no disponible</h1>
        <Link to="/">Volver a la vitrina</Link>
      </main>
    )
  // artesano_publico contiene exclusivamente acreditaciones aprobadas.
  return (
    <main className="pagina vitrina" lang="es">
      <Link to="/">Volver a la vitrina</Link>
      <header className="vitrina-perfil">
        <div>
          <h1>{datos.nombre}</h1>
          <p>
            {datos.lugar}
            {datos.asociacion ? ` · ${datos.asociacion}` : ''}
          </p>
          <p>{datos.historia || 'Este artesano todavía no ha compartido su historia.'}</p>
        </div>
        <SelloRna estado="aprobada" />
      </header>
      <Catalogo key={id} artesanoId={id} />
    </main>
  )
}
