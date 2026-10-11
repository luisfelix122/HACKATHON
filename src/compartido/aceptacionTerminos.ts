export const VERSION_TERMINOS = '2026-10-11-borrador'
export interface AceptacionTerminos {
  version: string
  aceptadoEn: string
}
const clave = (cuenta: string) => `ayllu:terminos:${cuenta}`

/** Registro local por cuenta; no demuestra consentimiento en el servidor. */
export function consultarAceptacion(cuenta: string): AceptacionTerminos | null {
  if (!cuenta) return null
  try {
    const entrada: unknown = JSON.parse(localStorage.getItem(clave(cuenta)) ?? 'null')
    if (typeof entrada !== 'object' || entrada === null) return null
    const dato = entrada as Partial<AceptacionTerminos>
    return dato.version === VERSION_TERMINOS &&
      typeof dato.aceptadoEn === 'string' &&
      Number.isFinite(Date.parse(dato.aceptadoEn))
      ? (dato as AceptacionTerminos)
      : null
  } catch {
    return null
  }
}
export function aceptarTerminos(cuenta: string): AceptacionTerminos {
  if (!cuenta.trim()) throw new Error('Ingresa para registrar tu aceptación.')
  const aceptacion = { version: VERSION_TERMINOS, aceptadoEn: new Date().toISOString() }
  localStorage.setItem(clave(cuenta), JSON.stringify(aceptacion))
  return aceptacion
}
