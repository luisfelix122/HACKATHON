import { useCallback, useEffect, useState } from 'react'
import { obtenerPerfil, type Perfil } from './perfil'

const clave = (id: string) => `aylly.perfil.${id}`

function leerCopia(id: string): Perfil | null {
  try {
    const texto = localStorage.getItem(clave(id))
    return texto ? (JSON.parse(texto) as Perfil) : null
  } catch {
    return null
  }
}

function guardarCopia(perfil: Perfil | null, id: string) {
  try {
    if (perfil) localStorage.setItem(clave(id), JSON.stringify(perfil))
  } catch {
    // Sin almacenamiento disponible: se seguirá pidiendo al servidor.
  }
}

interface Resultado {
  consulta: string
  perfil: Perfil | null
  sinConexion: boolean
}

/**
 * Perfil del usuario con sesión. Guarda una copia local para que la APK abra
 * sin conexión después del primer ingreso (CC-03); `sinConexion` indica que se
 * muestra la copia.
 */
export function usePerfil(id: string | undefined) {
  const [version, setVersion] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const consulta = id ? `${id}:${version}` : null

  useEffect(() => {
    if (!id) return
    let vigente = true
    const actual = `${id}:${version}`
    obtenerPerfil(id)
      .then((perfil) => {
        guardarCopia(perfil, id)
        if (vigente) setResultado({ consulta: actual, perfil, sinConexion: false })
      })
      .catch(() => {
        if (vigente) setResultado({ consulta: actual, perfil: leerCopia(id), sinConexion: true })
      })
    return () => {
      vigente = false
    }
  }, [id, version])

  const recargar = useCallback(() => setVersion((v) => v + 1), [])
  const vigente = consulta !== null && resultado?.consulta === consulta
  return {
    perfil: vigente ? resultado.perfil : null,
    cargando: consulta !== null && !vigente,
    sinConexion: vigente ? resultado.sinConexion : false,
    recargar,
  }
}
