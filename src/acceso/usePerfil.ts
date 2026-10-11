import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { z } from 'zod'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { Network } from '@capacitor/network'
import { useSesion } from '../compartido/sesion'
import { CLAVE_SESION } from '../compartido/supabase'
import type { Perfil } from '../compartido/dominio/perfil'
import { LUGARES } from '../compartido/dominio/lugares'
import { leerPerfil } from './perfil'
import { completarGoogle } from './googleApk'

let retornoInicial: Promise<void> | undefined
/** Un solo canje por arranque aunque ingreso, registro y rutas monten el hook. */
export function procesarRetornoInicial(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve()
  retornoInicial ??= App.getLaunchUrl().then(async (retorno) => {
    if (!retorno?.url) return
    try {
      await completarGoogle(retorno.url)
    } finally {
      await Browser.close().catch(() => undefined)
    }
  })
  return retornoInicial
}

const cache = z.object({
  id: z.string(),
  rol: z.literal('artesano'),
  nombre: z.string(),
  whatsapp: z.string(),
  lugar: z.enum(LUGARES),
  rna_numero: z.string(),
  asociacion: z.string().nullable(),
  historia: z.string().nullable(),
  acreditacion: z.enum(['pendiente', 'aprobada', 'rechazada']),
  acreditacion_nota: z.string().nullable(),
  creado_en: z.string(),
})
function clave(id: string) {
  return `ayllu.perfil.${id}`
}
export function guardarCopia(perfil: Perfil) {
  if (perfil.rol !== 'artesano') return
  try {
    localStorage.setItem(clave(perfil.id), JSON.stringify(perfil))
  } catch {
    /* La sesión online sigue disponible. */
  }
}
function leerCopia(id: string): Perfil | null {
  try {
    const resultado = cache.safeParse(JSON.parse(localStorage.getItem(clave(id)) ?? 'null'))
    return resultado.success && resultado.data.id === id ? resultado.data : null
  } catch {
    return null
  }
}

/** Lee la sesión ya guardada cuando Auth no puede renovar el token sin señal. */
export function useSesionApk() {
  const actual = useSesion()
  const [errorRetorno, setErrorRetorno] = useState<string | null>(null)
  const [conectado, setConectado] = useState(navigator.onLine)
  useEffect(() => {
    let vigente = true
    const registrar = Network.addListener('networkStatusChange', (estado) => {
      if (vigente) setConectado(estado.connected)
    })
    void Network.getStatus()
      .then((estado) => {
        if (vigente) setConectado(estado.connected)
      })
      .catch(() => undefined)
    return () => {
      vigente = false
      void registrar.then((escucha) => escucha.remove())
    }
  }, [])
  useEffect(() => {
    let vigente = true
    void procesarRetornoInicial().catch(() => {
      if (vigente)
        setErrorRetorno('Google no volvió a la app. Revisa tu conexión y vuelve a intentarlo.')
    })
    return () => {
      vigente = false
    }
  }, [])
  if (!conectado) {
    try {
      const guardada = JSON.parse(localStorage.getItem(CLAVE_SESION) ?? 'null') as Session | null
      if (
        guardada &&
        typeof guardada.access_token === 'string' &&
        typeof guardada.user?.id === 'string'
      )
        return { sesion: guardada, cargando: false, errorRetorno }
    } catch {
      /* Un almacenamiento inválido exige un ingreso nuevo con red. */
    }
    return { sesion: null, cargando: false, errorRetorno }
  }
  return { ...actual, errorRetorno }
}

export function usePerfil(sesion: Session | null) {
  const id = sesion?.user.id
  const [estado, setEstado] = useState<{
    id?: string
    perfil: Perfil | null
    cargando: boolean
    error: string | null
  }>({ perfil: null, cargando: true, error: null })
  const [revision, setRevision] = useState(0)
  const actualizar = useCallback(() => setRevision((valor) => valor + 1), [])
  useEffect(() => {
    if (!id) return
    let vigente = true
    const copia = leerCopia(id)
    void leerPerfil(id)
      .then((perfil) => {
        if (!vigente) return
        if (perfil) guardarCopia(perfil)
        else localStorage.removeItem(clave(id))
        setEstado({ id, perfil, cargando: false, error: null })
      })
      .catch(() => {
        if (vigente)
          setEstado({
            id,
            perfil: copia,
            cargando: false,
            error: copia ? null : 'No pudimos leer tu perfil. Revisa tu conexión y reintenta.',
          })
      })
    return () => {
      vigente = false
    }
  }, [id, revision])
  if (!id) return { perfil: null, cargando: false, error: estado.error, actualizar }
  if (estado.id !== id)
    return { perfil: leerCopia(id), cargando: !leerCopia(id), error: null, actualizar }
  return { ...estado, actualizar }
}
