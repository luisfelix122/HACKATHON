import { Esqueleto } from '../compartido/ui/Esqueleto'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Boton, Franja, Matricula, SelloRna } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
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
        <Boton icono="adelante" onClick={reintentar}>
          Reintentar
        </Boton>
      </main>
    )
  if (datos === undefined)
    return (
      <main className="pagina">
        <Esqueleto variante="detalle" etiqueta="Cargando perfil…" />
      </main>
    )
  if (!datos)
    return (
      <main className="pagina vitrina">
        <h1>Artesano no disponible</h1>
        <Link className="boton boton-secundario" to="/catalogo">
          <Icono nombre="catalogo" />
          Explorar el catálogo
        </Link>
      </main>
    )
  // artesano_publico contiene exclusivamente acreditaciones aprobadas.
  return (
    <main className="vitrina" lang="es">
      <Franja tono="casco" className="vitrina-perfil">
        <Link className="vitrina-volver" to="/catalogo">
          <Icono nombre="atras" />
          Volver al catálogo
        </Link>
        <div className="vitrina-perfil-cabecera">
          <SelloRna estado="aprobada" />
          <div>
            <h1 className="rotulo vitrina-perfil-nombre">{datos.nombre}</h1>
            <p className="vitrina-perfil-lugar">
              <Matricula>{datos.lugar}</Matricula>
              {datos.asociacion && <span>{datos.asociacion}</span>}
            </p>
          </div>
        </div>
        <p className="vitrina-perfil-historia">
          {datos.historia || 'Este artesano todavía no ha compartido su historia.'}
        </p>
      </Franja>
      <div className="pagina">
        <Catalogo key={id} artesanoId={id} />
      </div>
    </main>
  )
}
