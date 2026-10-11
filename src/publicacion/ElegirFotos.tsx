import React, { useRef } from 'react'
import type { VarianteFoto, OrigenFoto } from '../compartido/dominio/producto'

export interface ItemFotoUI {
  id: string
  origen: OrigenFoto
  variante: VarianteFoto | null
  ruta: string
  urlVisual: string
  publicada: boolean
  posicion: number
}

export interface ElegirFotosProps {
  fotos: ItemFotoUI[]
  alCambiarFotos: (fotosActualizadas: ItemFotoUI[]) => void
  deshabilitado?: boolean
  /** Sube una foto propia del artesano. Sin esta prop no se muestra el botón. */
  alAgregar?: (archivo: File) => void
  /** Borra una foto que no sea la original. */
  alQuitar?: (foto: ItemFotoUI) => void
  agregando?: boolean
  puedeAgregar?: boolean
}

const ETIQUETAS_VARIANTES: Record<VarianteFoto, string> = {
  estudio: 'Estudio',
  luz: 'Luz corregida',
  vitrina: 'Vitrina',
  contexto: 'Contexto',
}

export const ElegirFotos: React.FC<ElegirFotosProps> = ({
  fotos,
  alCambiarFotos,
  deshabilitado = false,
  alAgregar,
  alQuitar,
  agregando = false,
  puedeAgregar = true,
}) => {
  const entradaArchivo = useRef<HTMLInputElement>(null)
  const togglePublicada = (id: string) => {
    if (deshabilitado) return
    const actualizadas = fotos.map((f) => (f.id === id ? { ...f, publicada: !f.publicada } : f))
    alCambiarFotos(actualizadas)
  }

  const moverFoto = (indice: number, direccion: 'arriba' | 'abajo') => {
    if (deshabilitado) return
    const nuevoIndice = direccion === 'arriba' ? indice - 1 : indice + 1
    if (nuevoIndice < 0 || nuevoIndice >= fotos.length) return

    const copia = [...fotos]
    const temp = copia[indice]!
    copia[indice] = copia[nuevoIndice]!
    copia[nuevoIndice] = temp

    // Reasignar posiciones secuenciales
    const reordenadas = copia.map((f, pos) => ({ ...f, posicion: pos }))
    alCambiarFotos(reordenadas)
  }

  const fotosPublicadas = fotos.filter((f) => f.publicada)

  return (
    <section className="seccion-elegir-fotos" aria-label="Selección de fotos">
      <header className="elegir-fotos-cabecera">
        <h3 className="subtitulo-elegir-fotos">Fotos del producto</h3>
        <p className="descripcion-elegir-fotos">
          Elige qué fotos se ven en la vitrina y su orden. Puedes agregar fotos tuyas.
        </p>
      </header>

      {fotosPublicadas.length === 0 && (
        <div className="aviso-fotos-incompletas" role="alert">
          <span>⚠️ Marca al menos una foto para poder publicar.</span>
        </div>
      )}

      <div className="cuadricula-fotos" role="list">
        {fotos.map((foto, index) => {
          const esOriginal = foto.origen === 'original'
          const etiqueta = esOriginal
            ? 'Original'
            : foto.origen === 'adicional'
              ? 'Tu foto'
              : foto.variante
                ? ETIQUETAS_VARIANTES[foto.variante]
                : 'IA'

          return (
            <article
              key={foto.id}
              className={`tarjeta-foto ${foto.publicada ? 'foto-seleccionada' : 'foto-no-seleccionada'}`}
              role="listitem"
            >
              <div className="contenedor-imagen-foto">
                <img
                  src={foto.urlVisual}
                  alt={`Foto ${etiqueta} del producto`}
                  className="imagen-vista-previa"
                  loading="lazy"
                />
                <span
                  className={`insignia-origen ${esOriginal ? 'insignia-original' : 'insignia-ia'}`}
                >
                  {etiqueta}
                </span>
                {foto.publicada && (
                  <span className="insignia-posicion" title="Posición en vitrina">
                    #{foto.posicion + 1}
                  </span>
                )}
              </div>

              <div className="acciones-foto">
                <label className="etiqueta-checkbox-publicar">
                  <input
                    type="checkbox"
                    checked={foto.publicada}
                    onChange={() => togglePublicada(foto.id)}
                    disabled={deshabilitado}
                    className="checkbox-publicar"
                    aria-label={`Publicar foto ${etiqueta}`}
                  />
                  <span className="texto-publicar">
                    {foto.publicada ? 'Publicada' : 'No publicar'}
                  </span>
                </label>

                <div className="botones-orden" role="group" aria-label="Cambiar orden">
                  <button
                    type="button"
                    onClick={() => moverFoto(index, 'arriba')}
                    disabled={deshabilitado || index === 0}
                    className="boton-orden"
                    aria-label={`Mover foto ${etiqueta} antes`}
                    title="Mover antes"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moverFoto(index, 'abajo')}
                    disabled={deshabilitado || index === fotos.length - 1}
                    className="boton-orden"
                    aria-label={`Mover foto ${etiqueta} después`}
                    title="Mover después"
                  >
                    →
                  </button>
                </div>
              </div>

              {!esOriginal && alQuitar && (
                <button
                  type="button"
                  className="boton-quitar-foto"
                  onClick={() => alQuitar(foto)}
                  disabled={deshabilitado}
                >
                  Quitar foto
                </button>
              )}

              {esOriginal && (
                <div className="pie-foto-original">
                  <a
                    href={foto.urlVisual}
                    target="_blank"
                    rel="noreferrer"
                    className="enlace-ver-original"
                  >
                    Ver foto original completa
                  </a>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {alAgregar && (
        <div className="agregar-foto">
          <input
            ref={entradaArchivo}
            type="file"
            accept="image/*"
            hidden
            onChange={(evento) => {
              const archivo = evento.target.files?.[0]
              evento.target.value = ''
              if (archivo) alAgregar(archivo)
            }}
          />
          <button
            type="button"
            className="boton boton-secundario"
            disabled={deshabilitado || agregando || !puedeAgregar}
            aria-busy={agregando}
            onClick={() => entradaArchivo.current?.click()}
          >
            {agregando ? 'Subiendo foto…' : 'Agregar foto'}
          </button>
          {!puedeAgregar && (
            <p className="descripcion-elegir-fotos">Llegaste al máximo de fotos propias.</p>
          )}
        </div>
      )}
    </section>
  )
}
export default ElegirFotos
