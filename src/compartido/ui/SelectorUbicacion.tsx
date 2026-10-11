import { useEffect, useState } from 'react'
import { listarUbicaciones, type NivelUbicacion, type Ubicacion } from '../ubicaciones'
import { Aviso, Boton, Campo } from './componentes'
import { Esqueleto } from './Esqueleto'

function useOpciones(nivel: NivelUbicacion, padre?: string) {
  const [intento, setIntento] = useState(0)
  const clave = nivel + ':' + (padre ?? '') + ':' + intento
  const habilitado = nivel === 'departamento' || !!padre
  const [resultado, setResultado] = useState<{
    clave: string
    opciones: Ubicacion[]
    error?: string
  } | null>(null)
  useEffect(() => {
    if (!habilitado) return
    const controlador = new AbortController()
    void listarUbicaciones(nivel, padre, controlador.signal)
      .then((opciones) => {
        if (!controlador.signal.aborted) setResultado({ clave, opciones })
      })
      .catch((causa: unknown) => {
        if (!controlador.signal.aborted)
          setResultado({
            clave,
            opciones: [],
            error:
              causa instanceof Error
                ? causa.message
                : 'No pudimos cargar las ubicaciones. Revisa tu conexión y reintenta.',
          })
      })
    return () => controlador.abort()
  }, [nivel, padre, clave, habilitado])
  const actual = resultado?.clave === clave ? resultado : null
  return {
    opciones: habilitado ? (actual?.opciones ?? []) : [],
    error: habilitado ? actual?.error : undefined,
    cargando: habilitado && !actual,
    reintentar: () => setIntento((i) => i + 1),
  }
}

type Destino = { departamento: string; provincia: string; distrito: string }
export function SelectorUbicacion({
  valor,
  alCambiar,
  errores = {},
}: {
  valor: Destino
  alCambiar: (destino: Destino) => void
  errores?: Record<string, string>
}) {
  const departamentos = useOpciones('departamento')
  const departamento = departamentos.opciones.find((d) => d.nombre === valor.departamento)
  const provincias = useOpciones('provincia', departamento?.id)
  const provincia = provincias.opciones.find((p) => p.nombre === valor.provincia)
  const distritos = useOpciones('distrito', provincia?.id)
  const niveles = [
    {
      campo: 'departamento',
      etiqueta: 'Departamento',
      consulta: departamentos,
      habilitado: true,
      ayuda: 'Elige el departamento de destino.',
    },
    {
      campo: 'provincia',
      etiqueta: 'Provincia',
      consulta: provincias,
      habilitado: !!departamento,
      ayuda: 'Primero elige un departamento.',
    },
    {
      campo: 'distrito',
      etiqueta: 'Distrito',
      consulta: distritos,
      habilitado: !!provincia,
      ayuda: 'Primero elige una provincia.',
    },
  ] as const
  function cambiar(campo: keyof Destino, nombre: string) {
    if (campo === 'departamento') alCambiar({ departamento: nombre, provincia: '', distrito: '' })
    else if (campo === 'provincia') alCambiar({ ...valor, provincia: nombre, distrito: '' })
    else alCambiar({ ...valor, distrito: nombre })
  }
  return (
    <div className="selector-ubicacion">
      {niveles.map(({ campo, etiqueta, consulta, habilitado, ayuda }) => (
        <div key={campo}>
          <Campo etiqueta={etiqueta} ayuda={ayuda} error={errores[campo]}>
            {(atributos) => (
              <select
                {...atributos}
                required
                value={valor[campo]}
                disabled={!habilitado || consulta.cargando || !!consulta.error}
                onChange={(e) => cambiar(campo, e.target.value)}
              >
                <option value="">
                  {consulta.cargando ? 'Cargando…' : 'Selecciona ' + etiqueta.toLowerCase()}
                </option>
                {consulta.opciones.map((opcion) => (
                  <option key={opcion.id} value={opcion.nombre}>
                    {opcion.nombre}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          {consulta.cargando && (
            <Esqueleto variante="control" etiqueta={'Cargando ' + etiqueta.toLowerCase() + '…'} />
          )}
          {consulta.error && (
            <Aviso tono="error">
              {consulta.error}{' '}
              <Boton variante="secundario" onClick={consulta.reintentar}>
                Reintentar {etiqueta.toLowerCase()}
              </Boton>
            </Aviso>
          )}
        </div>
      ))}
    </div>
  )
}
