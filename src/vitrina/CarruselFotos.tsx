import { useRef, useState } from 'react'
import { Boton } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import { urlFoto, type FotoPublica } from './consultas'

export function CarruselFotos({ fotos, titulo }: { fotos: FotoPublica[]; titulo: string }) {
  const publicadas = fotos
    .filter((foto) => foto.publicada)
    .sort((a, b) => a.posicion - b.posicion || a.id.localeCompare(b.id))
  const original = fotos.find((foto) => foto.origen === 'original' && !foto.publicada)
  const [indice, setIndice] = useState(0)
  const [fallidas, setFallidas] = useState<string[]>([])
  const inicio = useRef<number | null>(null)
  const actual = publicadas[indice % Math.max(1, publicadas.length)]
  function mover(delta: number) {
    setIndice((n) => (n + delta + publicadas.length) % publicadas.length)
  }
  return (
    <section
      className="vitrina-carrusel"
      aria-label={`Fotos de ${titulo}`}
      aria-roledescription="carrusel"
    >
      <div
        className="vitrina-foto"
        onTouchStart={(e) => {
          inicio.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e) => {
          if (inicio.current !== null && publicadas.length > 1) {
            const delta = (e.changedTouches[0]?.clientX ?? inicio.current) - inicio.current
            if (Math.abs(delta) > 50) mover(delta < 0 ? 1 : -1)
          }
          inicio.current = null
        }}
      >
        {actual && !fallidas.includes(actual.id) ? (
          <img
            src={urlFoto(actual.ruta)}
            alt={`${titulo}, ${actual.variante ?? 'foto original'}`}
            onError={() => setFallidas((prev) => [...prev, actual.id])}
          />
        ) : (
          <p className="vitrina-sin-foto">
            <Icono nombre="camara" tamano={40} />
            Sin foto todavía
          </p>
        )}
      </div>
      <div className="vitrina-controles">
        {publicadas.length > 1 && (
          <Boton
            variante="secundario"
            icono="atras"
            aria-label="Foto anterior"
            onClick={() => mover(-1)}
          >
            Anterior
          </Boton>
        )}
        <span role="status" aria-live="polite">
          {publicadas.length
            ? `${(indice % publicadas.length) + 1} de ${publicadas.length}`
            : 'Sin fotos'}
        </span>
        {publicadas.length > 1 && (
          <Boton
            variante="secundario"
            icono="adelante"
            aria-label="Foto siguiente"
            onClick={() => mover(1)}
          >
            Siguiente
          </Boton>
        )}
      </div>
      {original && (
        <a href={urlFoto(original.ruta)} target="_blank" rel="noopener noreferrer">
          Ver foto original
        </a>
      )}
    </section>
  )
}
