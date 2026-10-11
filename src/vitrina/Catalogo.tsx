import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Aviso, Boton, Campo, Franja, Tablon } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { LUGARES } from '../compartido/dominio/lugares'
import { TIPOS_PRODUCTO } from '../compartido/dominio/producto'
import {
  consultarCatalogo,
  precioPEN,
  urlFoto,
  useConsulta,
  type CatalogoPublico,
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
        {!artesanoId && (
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
        )}
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
        {!artesanoId && (
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
        )}
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
          <Boton variante="secundario" icono="cerrar" onClick={() => setUrl(new URLSearchParams())}>
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
            <Boton icono="adelante" onClick={reintentar}>
              Reintentar
            </Boton>
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
    <main className="vitrina" lang="es">
      <Franja tono="casco" className="vitrina-casco">
        <h1>Catálogo</h1>
        <p className="vitrina-bajada">
          Piezas hechas a mano en las caletas del norte de Piura, con el nombre de quien las hizo.
        </p>
        <nav className="vitrina-costa" aria-label="Explorar por lugar">
          {LUGARES.map((lugar) => (
            <button
              key={lugar}
              type="button"
              className="vitrina-matricula"
              aria-pressed={filtros.lugar === lugar}
              onClick={() => cambiar('lugar', filtros.lugar === lugar ? '' : lugar)}
            >
              {lugar}
            </button>
          ))}
        </nav>
      </Franja>
      <div className="pagina">{contenido}</div>
    </main>
  )
}

function Cuadricula({ datos }: { datos: CatalogoPublico }) {
  return (
    <ul className="vitrina-cuadricula">
      {datos.productos.map((producto) => {
        const foto = datos.fotos.find((f) => f.producto_id === producto.id && f.publicada)
        return (
          <li key={producto.id}>
            <Link
              to={`/producto/${producto.id}`}
              aria-label={`${producto.titulo}, de ${producto.artesano_nombre}`}
            >
              <Tablon
                titulo={producto.titulo}
                lugar={producto.lugar}
                artesano={producto.artesano_nombre}
                tipo={producto.tipo_producto}
                precio={precioPEN(producto.precio_final)}
                foto={foto ? urlFoto(foto.ruta) : undefined}
              >
                {producto.disponibilidad === 'a_pedido' && (
                  <p className="vitrina-disponibilidad">
                    <Icono nombre="pedidos" tamano={18} />A pedido, en {producto.plazo_dias} días
                  </p>
                )}
              </Tablon>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
