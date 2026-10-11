import React, { useRef } from 'react'
import type { VarianteFoto, OrigenFoto } from '../compartido/dominio/producto'
import { Icono } from '../compartido/ui/Icono'

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
        <h2 className="subtitulo-elegir-fotos">Fotos</h2>
        <p className="descripcion-elegir-fotos">
          {fotosPublicadas.length} de {fotos.length} en la vitrina. Marca cuáles se ven y ordénalas.
        </p>
      </header>

      {fotosPublicadas.length === 0 && (
        <p className="aviso-fotos-incompletas" role="alert">
          <Icono nombre="alerta" tamano={20} />
          Marca al menos una foto para poder publicar.
        </p>
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
                  <span className="insignia-posicion" title="Posición en la vitrina">
                    {foto.posicion + 1}
                  </span>
                )}
              </div>

              <label className="etiqueta-checkbox-publicar">
                <input
                  type="checkbox"
                  checked={foto.publicada}
                  onChange={() => togglePublicada(foto.id)}
                  disabled={deshabilitado}
                  className="checkbox-publicar"
                  aria-label={`Mostrar foto ${etiqueta} en la vitrina`}
                />
                <span className="texto-publicar">{foto.publicada ? 'En vitrina' : 'Oculta'}</span>
              </label>

              <div className="acciones-foto" role="group" aria-label={`Acciones de ${etiqueta}`}>
                <button
                  type="button"
                  onClick={() => moverFoto(index, 'arriba')}
                  disabled={deshabilitado || index === 0}
                  className="boton-orden"
                >
                  <Icono nombre="atras" tamano={20} etiqueta={`Mover foto ${etiqueta} antes`} />
                </button>
                <button
                  type="button"
                  onClick={() => moverFoto(index, 'abajo')}
                  disabled={deshabilitado || index === fotos.length - 1}
                  className="boton-orden"
                >
                  <Icono
                    nombre="adelante"
                    tamano={20}
                    etiqueta={`Mover foto ${etiqueta} después`}
                  />
                </button>
                {esOriginal ? (
                  <a href={foto.urlVisual} target="_blank" rel="noreferrer" className="boton-orden">
                    <Icono nombre="imagen" tamano={20} etiqueta="Ver foto original completa" />
                  </a>
                ) : (
                  alQuitar && (
                    <button
                      type="button"
                      className="boton-orden boton-quitar-foto"
                      onClick={() => alQuitar(foto)}
                      disabled={deshabilitado}
                    >
                      <Icono nombre="borrar" tamano={20} etiqueta={`Quitar foto ${etiqueta}`} />
                    </button>
                  )
                )}
              </div>
            </article>
          )
        })}

        {alAgregar && (
          <div className="agregar-foto" role="listitem">
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
              className="agregar-foto-boton"
              disabled={deshabilitado || agregando || !puedeAgregar}
              aria-busy={agregando}
              onClick={() => entradaArchivo.current?.click()}
            >
              <Icono nombre={agregando ? 'sincronizar' : 'nuevo'} tamano={28} />
              {agregando ? 'Subiendo…' : puedeAgregar ? 'Agregar foto' : 'Máximo de fotos'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
export default ElegirFotos
