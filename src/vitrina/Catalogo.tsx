import { useCallback, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { LUGARES } from '../compartido/dominio/lugares'
import { TIPOS_PRODUCTO } from '../compartido/dominio/producto'
import {
  consultarCatalogo,
  precioPEN,
  urlFoto,
  useConsulta,
  type CatalogoPublico,
  type FotoPublica,
} from './consultas'
import { coincideProducto, escribirFiltros, leerFiltros } from './filtros'

export function Catalogo({
  artesanoId,
  soloCatalogo = false,
}: {
  artesanoId?: string
  soloCatalogo?: boolean
}) {
  const [url, setUrl] = useSearchParams()
  const filtros = leerFiltros(url)
  const cargar = useCallback(() => consultarCatalogo(artesanoId), [artesanoId])
  const { datos, error, reintentar } = useConsulta(cargar)
  const visibles = datos?.productos.filter((p) => coincideProducto(p, filtros)) ?? []
  const asociaciones = [
    ...new Set(datos?.productos.map((p) => p.asociacion).filter((a): a is string => !!a)),
  ].sort((a, b) => a.localeCompare(b, 'es'))
  const conteos = new Map<string, number>()
  for (const p of visibles)
    for (const etiqueta of p.etiquetas) conteos.set(etiqueta, (conteos.get(etiqueta) ?? 0) + 1)
  const etiquetas = [...conteos]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, 8)
  function cambiar(clave: keyof typeof filtros, valor: string) {
    setUrl(escribirFiltros({ ...filtros, [clave]: valor }))
  }
  const controles = (
    <>
      <section className="vitrina-filtros" aria-label="Buscar y filtrar productos">
        <Campo etiqueta="Buscar una pieza">
          {(atributos) => (
            <input
              {...atributos}
              type="search"
              placeholder="Nombre o título del producto"
              value={filtros.buscar}
              onChange={(e) => cambiar('buscar', e.target.value)}
            />
          )}
        </Campo>
        <Campo etiqueta="Lugar">
          {(atributos) => (
            <select
              {...atributos}
              value={filtros.lugar}
              onChange={(e) => cambiar('lugar', e.target.value)}
            >
              <option value="">Todos los lugares</option>
              {LUGARES.map((lugar) => (
                <option key={lugar}>{lugar}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Tipo de producto">
          {(atributos) => (
            <select
              {...atributos}
              value={filtros.tipo}
              onChange={(e) => cambiar('tipo', e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {TIPOS_PRODUCTO.map((tipo) => (
                <option key={tipo}>{tipo}</option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Asociación">
          {(atributos) => (
            <select
              {...atributos}
              value={filtros.asociacion}
              onChange={(e) => cambiar('asociacion', e.target.value)}
            >
              <option value="">Todas las asociaciones</option>
              {filtros.asociacion && !asociaciones.includes(filtros.asociacion) && (
                <option>{filtros.asociacion}</option>
              )}
              {asociaciones.map((asociacion) => (
                <option key={asociacion}>{asociacion}</option>
              ))}
            </select>
          )}
        </Campo>
      </section>
      <div className="vitrina-chips" aria-label="Etiquetas de los productos visibles">
        {etiquetas.map(([etiqueta]) => (
          <button
            key={etiqueta}
            className="vitrina-chip"
            aria-pressed={filtros.etiqueta === etiqueta}
            onClick={() => cambiar('etiqueta', filtros.etiqueta === etiqueta ? '' : etiqueta)}
          >
            {etiqueta}
          </button>
        ))}
        {filtros.etiqueta && !conteos.has(filtros.etiqueta) && (
          <button
            className="vitrina-chip"
            aria-pressed="true"
            onClick={() => cambiar('etiqueta', '')}
          >
            {filtros.etiqueta}: quitar filtro
          </button>
        )}
        {Object.values(filtros).some(Boolean) && (
          <Boton variante="secundario" onClick={() => setUrl(new URLSearchParams())}>
            Limpiar filtros
          </Boton>
        )}
      </div>
    </>
  )
  const contenido = (
    <>
      {controles}
      <section
        aria-labelledby={artesanoId ? 'productos-artesano' : 'productos-vitrina'}
        aria-busy={!datos && !error}
      >
        <div className="vitrina-cabecera">
          <h2 id={artesanoId ? 'productos-artesano' : 'productos-vitrina'}>
            {artesanoId ? 'Sus productos' : 'Piezas para llevar contigo'}
          </h2>
          {datos && (
            <p role="status">
              {visibles.length} {visibles.length === 1 ? 'producto' : 'productos'}
            </p>
          )}
        </div>
        {error ? (
          <>
            <Aviso tono="error">
              No pudimos cargar los productos. Revisa tu conexión y reintenta.
            </Aviso>
            <Boton onClick={reintentar}>Reintentar</Boton>
          </>
        ) : !datos ? (
          <Aviso>Cargando productos…</Aviso>
        ) : visibles.length ? (
          <Cuadricula datos={{ ...datos, productos: visibles }} />
        ) : (
          <Aviso>
            {datos.productos.length
              ? 'No hay productos con estos filtros. Prueba otro lugar o limpia los filtros.'
              : 'Las piezas aparecen aquí cuando los artesanos las publican.'}
          </Aviso>
        )}
      </section>
    </>
  )
  if (artesanoId) return <div className="vitrina">{contenido}</div>
  const artesanos = [...new Map(datos?.productos.map((p) => [p.artesano_id, p])).values()].slice(
    0,
    3,
  )
  return (
    <main
      className={soloCatalogo ? 'vitrina catalogo-completo' : 'vitrina inicio-costero'}
      lang="es"
    >
      {soloCatalogo ? (
        <header className="pagina encabezado-catalogo">
          <h1>El oficio de la costa, pieza a pieza.</h1>
          <p>Encuentra una pieza, conoce su origen y conversa con quien la hizo.</p>
        </header>
      ) : (
        <section className="hero-costero" aria-labelledby="titulo-inicio">
          <img
            className="hero-paisaje"
            src="/editorial/costa.png"
            alt="Escena ilustrativa de una caleta con chalanas sobre el mar turquesa"
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <div className="hero-texto">
            <h1 id="titulo-inicio">
              Llévate una
              <br />
              historia de la costa
            </h1>
            <p>
              Piezas hechas a mano en las caletas del norte de Piura. Conoce su origen y a quienes
              las crean.
            </p>
            <Link className="boton boton-destacado" to="/catalogo">
              Explorar las piezas <span aria-hidden="true">→</span>
            </Link>
            <a className="hero-enlace" href="#caletas">
              Conocer las caletas
            </a>
          </div>
          <figure className="hero-oficio">
            <img
              src="/editorial/oficio.png"
              alt="Ilustración de unas manos tejiendo una pieza de fibra natural"
              width="1536"
              height="1024"
            />
            <figcaption>De nuestras manos a tu viaje</figcaption>
          </figure>
          <nav className="hero-caletas" aria-label="Caletas destacadas">
            {['Los Órganos', 'Cabo Blanco', 'Lobitos'].map((lugar) => (
              <Link key={lugar} to={`/catalogo?lugar=${encodeURIComponent(lugar)}`}>
                <Pin />
                {lugar}
              </Link>
            ))}
          </nav>
        </section>
      )}
      <div className="pagina seleccion-piezas">
        {!soloCatalogo && (
          <div className="seleccion-titulo">
            <h2>Piezas para llevar contigo</h2>
            <Link to="/catalogo">
              Ver el catálogo <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
        <div className="tipos-editoriales" aria-label="Filtrar por tipo">
          {['', ...TIPOS_PRODUCTO].map((tipo) => (
            <button
              key={tipo}
              aria-pressed={filtros.tipo === tipo}
              onClick={() => cambiar('tipo', tipo)}
            >
              {tipo
                ? {
                    textil: 'Textiles',
                    'bisutería marina': 'Bisutería marina',
                    tallado: 'Tallados',
                    utilitario: 'Utilitarios',
                    otro: 'Otros',
                  }[tipo]
                : 'Todas las piezas'}
            </button>
          ))}
        </div>
        {soloCatalogo ? (
          contenido
        ) : (
          <>
            <details className="busqueda-inicio">
              <summary>Buscar y filtrar piezas</summary>
              {controles}
            </details>
            <section aria-label="Selección de piezas" aria-busy={!datos && !error}>
              {error ? (
                <>
                  <Aviso tono="error">
                    No pudimos cargar las piezas. Revisa tu conexión y reintenta.
                  </Aviso>
                  <Boton onClick={reintentar}>Reintentar</Boton>
                </>
              ) : !datos ? (
                <Aviso>Cargando piezas…</Aviso>
              ) : visibles.length ? (
                <Cuadricula datos={{ ...datos, productos: visibles.slice(0, 4) }} />
              ) : (
                <Aviso>
                  {datos.productos.length
                    ? 'No hay piezas con estos filtros. Prueba otro tipo o limpia los filtros.'
                    : 'Las piezas aparecen aquí cuando los artesanos las publican.'}
                </Aviso>
              )}
              {Object.values(filtros).some(Boolean) && (
                <Boton variante="secundario" onClick={() => setUrl(new URLSearchParams())}>
                  Limpiar filtros
                </Boton>
              )}
            </section>
          </>
        )}
      </div>
      {!soloCatalogo && (
        <>
          <section className="banda-beneficios" aria-label="Comprar en Ayllu">
            <p>
              <Simbolo tipo="mano" />
              Hecho a mano
            </p>
            <p>
              <Simbolo tipo="personas" />
              Trato directo con el artesano
            </p>
            <p>
              <Simbolo tipo="caja" />
              Recojo o envío por agencia
            </p>
          </section>
          <section className="pagina caletas-editoriales" id="caletas">
            <div>
              <h2>
                El mar nos une.
                <br />
                Cada caleta tiene su historia.
              </h2>
              <p>
                Explora las piezas por su lugar de origen y conoce a los artesanos de la costa del
                norte de Piura.
              </p>
            </div>
            <nav aria-label="Explorar por lugar">
              {LUGARES.map((lugar) => (
                <Link key={lugar} to={`/catalogo?lugar=${encodeURIComponent(lugar)}`}>
                  <Pin />
                  {lugar}
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </section>
          {artesanos.length > 0 && (
            <section className="pagina artesanos-editoriales">
              <h2>Conoce las manos detrás de cada pieza</h2>
              <div>
                {artesanos.map((p) => (
                  <Link key={p.artesano_id} to={`/artesano/${p.artesano_id}`}>
                    <h3>{p.artesano_nombre}</h3>
                    <p>{p.lugar}</p>
                    <span>Conocer su historia →</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="como-pedir" id="como-pedir">
            <div className="pagina">
              <h2>De la caleta a tus manos</h2>
              <ol>
                <li>
                  <h3>Encuentra tu pieza</h3>
                  <p>Explora el catálogo, los materiales y la historia de quien la crea.</p>
                </li>
                <li>
                  <h3>Conversa y pide</h3>
                  <p>
                    Ingresa a tu cuenta y solicita recojo o envío. El artesano te confirma el total
                    y la fecha.
                  </p>
                </li>
                <li>
                  <h3>Confirma y recibe</h3>
                  <p>
                    Confirma el pedido, paga con el enlace del artesano y coordina la entrega en el
                    hilo de la orden.
                  </p>
                </li>
              </ol>
              <Link className="boton boton-destacado" to="/catalogo">
                Encontrar mi próxima pieza <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
          <p className="credito-editorial">
            Imágenes de portada ilustrativas creadas con IA; no representan productos ni artesanos
            del catálogo.
          </p>
        </>
      )}
    </main>
  )
}

function Pin() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 22S4 13 4 9a8 8 0 0 1 16 0c0 4-8 13-8 13Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}
function Simbolo({ tipo }: { tipo: 'mano' | 'personas' | 'caja' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="44"
      height="44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {tipo === 'caja' ? (
        <>
          <path d="m5 13 19-9 19 9v23l-19 9-19-9V13Zm0 0 19 9 19-9M24 22v23M15 8l19 9" />
        </>
      ) : tipo === 'personas' ? (
        <>
          <circle cx="24" cy="12" r="6" />
          <circle cx="8" cy="17" r="4" />
          <circle cx="40" cy="17" r="4" />
          <path d="M14 40V29a10 10 0 0 1 20 0v11H14ZM14 27c-8-5-12 2-12 8v5h12M34 27c8-5 12 2 12 8v5H34" />
        </>
      ) : (
        <path d="M17 25V9c0-4 5-4 5 0v14-18c0-4 5-4 5 0v19-16c0-4 5-4 5 0v18-12c0-4 5-4 5 0v18l4-8c2-4 7-1 5 3L35 43H20C9 41 8 33 8 25v-7c0-4 5-4 5 0v9" />
      )}
    </svg>
  )
}

function Cuadricula({ datos }: { datos: CatalogoPublico }) {
  return (
    <div className="vitrina-cuadricula">
      {datos.productos.map((producto) => {
        const foto = datos.fotos.find((f) => f.producto_id === producto.id && f.publicada)
        return (
          <Link key={producto.id} className="vitrina-tarjeta" to={`/producto/${producto.id}`}>
            <div className="vitrina-imagen">
              <FotoTarjeta key={foto?.ruta} foto={foto} titulo={producto.titulo} />
            </div>
            <Etiqueta
              titulo={producto.titulo}
              lugar={producto.lugar}
              artesano={producto.artesano_nombre}
              precio={precioPEN(producto.precio_final)}
            >
              <span className="disponibilidad-pieza">
                {producto.disponibilidad === 'en_stock'
                  ? 'Disponible'
                  : `A pedido · ${producto.plazo_dias} días`}
              </span>
            </Etiqueta>
          </Link>
        )
      })}
    </div>
  )
}

function FotoTarjeta({ foto, titulo }: { foto: FotoPublica | undefined; titulo: string }) {
  const [fallida, setFallida] = useState(false)
  return foto && !fallida ? (
    <img
      src={urlFoto(foto.ruta)}
      alt={`${titulo}, ${foto.variante ?? 'foto original'}`}
      loading="lazy"
      onError={() => setFallida(true)}
    />
  ) : (
    <span>Foto no disponible</span>
  )
}

function Etiqueta(props: {
  titulo: string
  lugar: string
  artesano: string
  precio?: string
  children?: ReactNode
}) {
  return (
    <article className="etiqueta">
      <span className="etiqueta-lugar">{props.lugar}</span>
      <h3 className="etiqueta-titulo">{props.titulo}</h3>
      <span className="etiqueta-autor">Hecho por {props.artesano}</span>
      {props.precio && <span className="etiqueta-precio">{props.precio}</span>}
      {props.children}
    </article>
  )
}
