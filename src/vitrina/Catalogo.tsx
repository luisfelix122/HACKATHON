import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Campo, Etiqueta } from '../compartido/ui/componentes'
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

export function Catalogo({ artesanoId }: { artesanoId?: string }) {
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
  const contenido = (
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
      <section
        aria-labelledby={artesanoId ? 'productos-artesano' : 'productos-vitrina'}
        aria-busy={!datos && !error}
      >
        <div className="vitrina-cabecera">
          <h2 id={artesanoId ? 'productos-artesano' : 'productos-vitrina'}>
            {artesanoId ? 'Sus productos' : 'Encuentra tu próxima pieza'}
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
  return (
    <main className="pagina vitrina" lang="es">
      <section className="portada">
        <h1>Hecho a mano, junto al mar.</h1>
        <p className="portada-bajada">
          Descubre piezas de las caletas del norte de Piura y conoce a quienes las hacen.
        </p>
      </section>
      <nav className="vitrina-costa" aria-label="Explorar por lugar">
        <h2>La ruta de la costa</h2>
        <div>
          {LUGARES.map((lugar) => (
            <button
              key={lugar}
              aria-pressed={filtros.lugar === lugar}
              onClick={() => cambiar('lugar', filtros.lugar === lugar ? '' : lugar)}
            >
              {lugar}
            </button>
          ))}
        </div>
      </nav>
      {contenido}
    </main>
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
            />
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
