import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Boton, SelloRna } from '../compartido/ui/componentes'
import { BotonPedir } from '../pedidos/BotonPedir'
import { consultarProducto, precioPEN, useConsulta } from './consultas'
import { CarruselFotos } from './CarruselFotos'
import { enlaceWhatsapp } from './whatsapp'

export function FichaProducto() {
  const { id = '' } = useParams()
  const cargar = useCallback(() => consultarProducto(id), [id])
  const { datos, error, reintentar } = useConsulta(cargar)
  if (error)
    return (
      <main className="pagina vitrina">
        <h1>No pudimos cargar el producto</h1>
        <Aviso tono="error">Revisa tu conexión y reintenta.</Aviso>
        <Boton onClick={reintentar}>Reintentar</Boton>
      </main>
    )
  if (datos === undefined)
    return (
      <main className="pagina">
        <Aviso>Cargando producto…</Aviso>
      </main>
    )
  if (!datos)
    return (
      <main className="pagina vitrina">
        <h1>Producto no disponible</h1>
        <p>La pieza no existe o ya no está publicada.</p>
        <Link to="/">Explorar productos</Link>
      </main>
    )
  const { producto: p, fotos, artesano } = datos
  const whatsapp = enlaceWhatsapp(artesano.whatsapp, p.nombre)
  return (
    <main className="pagina vitrina" lang="es">
      <Link to="/">Volver a la vitrina</Link>
      <div className="vitrina-detalle">
        <CarruselFotos key={p.id} fotos={fotos} titulo={p.titulo} />
        <section className="vitrina-ficha">
          <p className="texto-secundario">{p.lugar}</p>
          <h1>{p.titulo}</h1>
          <Link to={`/artesano/${p.artesano_id}`}>Hecho por {artesano.nombre}</Link>
          <SelloRna estado="aprobada" />
          <p>{p.ficha.descripcion}</p>
          <p className="vitrina-precio">{precioPEN(p.precio_final)}</p>
          <p>
            {p.disponibilidad === 'a_pedido'
              ? `Se hace a pedido en ${p.plazo_dias} días`
              : 'Disponible ahora'}
          </p>
          <div className="vitrina-acciones">
            <BotonPedir productoId={p.id} />
            {whatsapp ? (
              <a
                className="boton boton-secundario"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactar por WhatsApp
              </a>
            ) : (
              <Aviso>El contacto por WhatsApp no está disponible.</Aviso>
            )}
          </div>
          <dl className="vitrina-datos">
            <dt>Materiales</dt>
            <dd>{p.ficha.materiales.join(', ')}</dd>
            <dt>Técnica</dt>
            <dd>{p.ficha.tecnica || 'No indicada'}</dd>
            <dt>Tipo de producto</dt>
            <dd>{p.ficha.tipo_producto}</dd>
          </dl>
          {p.ficha.historia_pieza && (
            <section>
              <h2>La historia de esta pieza</h2>
              <p>{p.ficha.historia_pieza}</p>
            </section>
          )}
          <div className="vitrina-chips" aria-label="Etiquetas">
            {p.etiquetas.map((etiqueta) => (
              <Link
                className="vitrina-chip"
                key={etiqueta}
                to={`/?etiqueta=${encodeURIComponent(etiqueta)}`}
              >
                {etiqueta}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
