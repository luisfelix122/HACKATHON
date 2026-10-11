import React from 'react'
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
}) => {
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
          Elige qué fotos mostrarás en la vitrina para los turistas y define su orden de aparición.
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
    </section>
  )
}
export default ElegirFotos
