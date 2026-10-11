import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Aviso, Boton, Matricula, SelloRna } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
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
        <Boton icono="adelante" onClick={reintentar}>
          Reintentar
        </Boton>
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
        <Link className="boton boton-secundario" to="/catalogo">
          <Icono nombre="catalogo" />
          Explorar el catálogo
        </Link>
      </main>
    )
  const { producto: p, fotos, artesano } = datos
  const whatsapp = enlaceWhatsapp(artesano.whatsapp, p.nombre)
  return (
    <main className="pagina vitrina" lang="es">
      <Link className="vitrina-volver" to="/catalogo">
        <Icono nombre="atras" />
        Volver al catálogo
      </Link>
      <div className="vitrina-detalle">
        <CarruselFotos key={p.id} fotos={fotos} titulo={p.titulo} />
        <section className="vitrina-ficha">
          <h1>{p.titulo}</h1>
          <div className="vitrina-autor">
            <SelloRna estado="aprobada" />
            <p>
              Hecho por{' '}
              <Link className="vitrina-autor-nombre" to={`/artesano/${p.artesano_id}`}>
                {artesano.nombre}
              </Link>
              <Matricula>{p.lugar}</Matricula>
            </p>
          </div>
          <p>{p.ficha.descripcion}</p>
          <div className="vitrina-precio-bloque">
            <p className="vitrina-precio">{precioPEN(p.precio_final)}</p>
            <p className="vitrina-disponibilidad">
              <Icono nombre={p.disponibilidad === 'a_pedido' ? 'pedidos' : 'exito'} tamano={20} />
              {p.disponibilidad === 'a_pedido'
                ? `Se hace a pedido en ${p.plazo_dias} días`
                : 'Disponible ahora'}
            </p>
          </div>
          <div className="vitrina-acciones">
            <BotonPedir productoId={p.id} />
            {whatsapp ? (
              <a
                className="boton boton-secundario"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icono nombre="mensaje" />
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
                to={`/catalogo?etiqueta=${encodeURIComponent(etiqueta)}`}
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
