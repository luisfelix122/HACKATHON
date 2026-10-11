/*
 * CONTRATO DE DIRECCIÓN (impeccable, semilla 9bfb688c; decisión 0006)
 * THESIS: la vitrina es el casco pintado de una chalana; cada pieza lleva el nombre
 *   de quien la hizo rotulado como el nombre de un bote. Rechaza el marketplace de
 *   foto grande con grilla de tarjetas iguales.
 * OWN-WORLD (ajuste sobrio, 0006): franjas a sangre de casco azul; superficies claras con
 *   filete fino y sombra suave; etiquetas de caleta; Fraunces en nombres propios y
 *   titulares; Atkinson para leer y tocar.
 * STORY: el visitante entiende que son piezas hechas a mano en las caletas del norte
 *   de Piura, confía porque ve quién y dónde (RNA verificado) y entra al catálogo.
 * FIRST VIEWPORT: franja de casco a sangre; a la izquierda el titular rotulado en
 *   grande y la bajada; «Ver el catálogo» (sol) y «Conoce las caletas»; a la derecha
 *   un horizonte con el sol sobre el mar y Ayllu en Fraunces (sin fotos: las CC BY-SA aún no
 *   traen su crédito en el contrato). Debajo asoman las matrículas de caleta.
 * FORM: «Rotulado de chalana», primero de la lista propia (elegido por Cristopher).
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
 *   review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
import { useCallback } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { LUGARES } from '../compartido/dominio/lugares'
import { TIPOS_PRODUCTO } from '../compartido/dominio/producto'
import { Aviso, Boton, Franja, Matricula, SelloRna, Tablon } from '../compartido/ui/componentes'
import { Icono, type NombreIcono } from '../compartido/ui/Icono'
import {
  consultarCatalogo,
  precioPEN,
  urlFoto,
  useConsulta,
  type CatalogoPublico,
  type ProductoPublico,
} from './consultas'
import { escribirFiltros, leerFiltros } from './filtros'

const ICONO_TIPO: Record<string, NombreIcono> = {
  textil: 'ovillo',
  'bisutería marina': 'concha',
  tallado: 'madera',
  utilitario: 'bolsa',
}

/** Tipos que se presentan en la landing («otro» queda en el catálogo). */
const TIPOS_DESTACADOS = TIPOS_PRODUCTO.filter((tipo) => tipo !== 'otro')

const PASOS_PEDIDO = [
  {
    titulo: 'Eliges y pides',
    texto: 'Elige la pieza y si la recoges en casa del artesano o te la envían por agencia.',
  },
  {
    titulo: 'El artesano confirma',
    texto: 'Te propone el total, con el envío, y la fecha estimada. Tú lo confirmas.',
  },
  {
    titulo: 'Pagas con su enlace',
    texto: 'Te envía un enlace de pago y verifica el abono él mismo.',
  },
  {
    titulo: 'La recibes',
    texto: 'Te avisa cuando la envía, con su número de guía, o cuando está lista para recoger.',
  },
]

function fotoDe(datos: CatalogoPublico, producto: ProductoPublico): string | undefined {
  const foto = datos.fotos.find((f) => f.producto_id === producto.id && f.publicada)
  return foto ? urlFoto(foto.ruta) : undefined
}

function artesanosDe(productos: ProductoPublico[]) {
  const porId = new Map<string, { id: string; nombre: string; lugar: string; piezas: number }>()
  for (const p of productos) {
    const actual = porId.get(p.artesano_id)
    if (actual) actual.piezas += 1
    else
      porId.set(p.artesano_id, {
        id: p.artesano_id,
        nombre: p.artesano_nombre,
        lugar: p.lugar,
        piezas: 1,
      })
  }
  return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

function contar(
  productos: ProductoPublico[] | undefined,
  clave: 'lugar' | 'tipo_producto',
  valor: string,
) {
  if (!productos) return null
  const n = productos.filter((p) => p[clave] === valor).length
  return n === 1 ? '1 pieza' : `${n} piezas`
}

function TablonEnlace({ datos, producto }: { datos: CatalogoPublico; producto: ProductoPublico }) {
  return (
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
        foto={fotoDe(datos, producto)}
      />
    </Link>
  )
}

export function Portada() {
  const { search } = useLocation()
  const cargar = useCallback(() => consultarCatalogo(), [])
  const { datos, error, reintentar } = useConsulta(cargar)

  // Antes el catálogo vivía en «/»: un enlace guardado con filtros llega igual (CC-17).
  // Solo cuentan los filtros: el regreso de Google (?code=…) y otros parámetros se quedan aquí.
  const filtros = escribirFiltros(leerFiltros(new URLSearchParams(search))).toString()
  if (filtros) return <Navigate to={`/catalogo?${filtros}`} replace />

  const productos = datos?.productos
  const destacadas = datos ? datos.productos.slice(0, 6) : []
  const artesanos = productos ? artesanosDe(productos) : []

  return (
    <main className="portada-landing" lang="es">
      {/* Primera pantalla: el casco pintado */}
      <Franja tono="casco" className="landing-casco" etiqueta="Ayllu">
        <div className="landing-casco-texto">
          <h1 className="rotulo landing-titulo">Hecho a mano en las caletas</h1>
          <p className="landing-bajada">
            Piezas de quienes viven frente al mar del norte de Piura. Cada una lleva el nombre de
            quien la hizo y su caleta, con su RNA verificado.
          </p>
          <div className="landing-acciones">
            <Link className="boton boton-destacado" to="/catalogo">
              <Icono nombre="catalogo" />
              Ver el catálogo
            </Link>
            <a className="boton boton-secundario" href="#caletas">
              <Icono nombre="ubicacion" />
              Conoce las caletas
            </a>
          </div>
        </div>
        {/* Proa pintada (CSS, sin datos): las fotos con licencia CC BY-SA no se destacan
            aquí hasta que el contrato tenga sus créditos (CC-17, traspaso). */}
        <div className="landing-proa" aria-hidden="true">
          <span className="landing-proa-nombre">Ayllu</span>
        </div>
      </Franja>

      {/* Las caletas, como placas de matrícula */}
      <section
        id="caletas"
        className="landing-seccion landing-caletas"
        aria-labelledby="titulo-caletas"
      >
        <div className="landing-contenido">
          <h2 id="titulo-caletas" className="landing-titulo-seccion">
            Las caletas
          </h2>
          <p className="texto-secundario">
            Elige una caleta y mira lo que hacen allí sus artesanos.
          </p>
          <nav aria-label="Las caletas">
            <ul className="landing-matriculas">
              {LUGARES.map((lugar) => (
                <li key={lugar}>
                  <Link
                    className="landing-matricula"
                    to={`/catalogo?lugar=${encodeURIComponent(lugar)}`}
                  >
                    <Matricula>{lugar}</Matricula>
                    {productos && (
                      <span className="landing-cuenta">{contar(productos, 'lugar', lugar)}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* Lo que se hace aquí */}
      <Franja tono="sol" className="landing-tipos">
        <h2 className="landing-titulo-seccion">Lo que se hace aquí</h2>
        <ul className="landing-tipos-lista">
          {TIPOS_DESTACADOS.map((tipo) => (
            <li key={tipo}>
              <Link
                className="landing-tipo"
                data-tipo={tipo}
                to={`/catalogo?tipo=${encodeURIComponent(tipo)}`}
              >
                <span className="landing-tipo-icono">
                  <Icono nombre={ICONO_TIPO[tipo] ?? 'productos'} tamano={36} />
                </span>
                <span className="landing-tipo-nombre">{tipo}</span>
                {productos && (
                  <span className="landing-cuenta">{contar(productos, 'tipo_producto', tipo)}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Franja>

      {/* Piezas y artesanos, desde la base */}
      {error ? (
        <div className="landing-contenido landing-estado">
          <Aviso tono="error">No pudimos cargar las piezas. Revisa tu conexión y reintenta.</Aviso>
          <Boton icono="adelante" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      ) : !datos ? (
        <div className="landing-contenido landing-estado" aria-busy="true">
          <Aviso>Cargando piezas…</Aviso>
        </div>
      ) : datos.productos.length === 0 ? (
        <div className="landing-contenido landing-estado">
          <Aviso>Las piezas aparecen aquí cuando los artesanos las publican.</Aviso>
        </div>
      ) : (
        <>
          <section className="landing-seccion" aria-labelledby="titulo-piezas">
            <div className="landing-contenido">
              <div className="landing-cabecera">
                <h2 id="titulo-piezas" className="landing-titulo-seccion">
                  Piezas de la vitrina
                </h2>
                <Link to="/catalogo">Ver todas las piezas</Link>
              </div>
              <ul className="landing-cuadricula">
                {destacadas.map((p) => (
                  <li key={p.id}>
                    <TablonEnlace datos={datos} producto={p} />
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="landing-seccion landing-artesanos" aria-labelledby="titulo-artesanos">
            <div className="landing-contenido">
              <div className="landing-artesanos-cabecera">
                <SelloRna estado="aprobada" />
                <div>
                  <h2 id="titulo-artesanos" className="landing-titulo-seccion">
                    Quién lo hace
                  </h2>
                  <p className="texto-secundario">
                    Todos tienen su registro de artesano (RNA) revisado por Ayllu.
                  </p>
                </div>
              </div>
              <ul className="landing-botes">
                {artesanos.map((a) => (
                  <li key={a.id}>
                    <Link className="landing-bote" to={`/artesano/${a.id}`}>
                      <span className="landing-bote-nombre">{a.nombre}</span>
                      <Matricula>{a.lugar}</Matricula>
                      <span className="landing-cuenta">
                        {a.piezas === 1 ? '1 pieza' : `${a.piezas} piezas`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* Cómo se pide: los pasos reales de una orden */}
      <section className="landing-seccion landing-pasos" aria-labelledby="titulo-pasos">
        <div className="landing-contenido">
          <h2 id="titulo-pasos" className="landing-titulo-seccion">
            Cómo se pide
          </h2>
          <ol className="landing-pasos-lista">
            {PASOS_PEDIDO.map((paso, i) => (
              <li key={paso.titulo}>
                <span className="landing-paso-numero" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Franja tono="casco" className="landing-cierre">
        <h2 className="landing-titulo-seccion">Lleva algo de la costa</h2>
        <p>Los artesanos publican sus piezas desde la app de Ayllu, en su celular.</p>
        <Link className="boton boton-destacado" to="/catalogo">
          <Icono nombre="catalogo" />
          Ver el catálogo
        </Link>
      </Franja>
      <footer className="landing-pie">
        <div className="landing-contenido">
          <span className="logotipo landing-pie-logo" aria-hidden="true">
            Ayll<span className="logotipo-u">u</span>
          </span>
          <p>Vitrina de artesanías de las caletas del norte de Piura y Talara.</p>
        </div>
      </footer>
    </main>
  )
}
