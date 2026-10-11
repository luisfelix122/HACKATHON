export const VARIANTES_FOTO = ['estudio', 'luz', 'vitrina', 'contexto'] as const
export type VarianteFoto = (typeof VARIANTES_FOTO)[number]

const PROMPTS_VARIANTES: Record<VarianteFoto, string> = {
  estudio:
    'Fotografía de catálogo en estudio profesional con fondo neutro limpio e iluminación difusa suave. Conserva estrictamente la forma, los colores auténticos, la textura original y los detalles de la pieza artesanal sin alterarlos.',
  luz: 'Fotografía con iluminación natural corregida y balance de blancos óptimo, realzando la artesanía. Conserva estrictamente la forma, los colores vivos, la textura original y los detalles de la pieza sin modificarla.',
  vitrina:
    'Fotografía de la pieza exhibida en una vitrina o repisa de madera de tienda de artesanías finas. Conserva estrictamente la forma, los colores, la textura y los detalles de la pieza artesanal.',
  contexto:
    'Fotografía ambientada en un taller artesanal o rincón decorativo cálido del norte peruano, con fondo desenfocado. Conserva estrictamente la forma, los colores auténticos, la textura y los detalles de la pieza.',
}

export function obtenerPromptVariante(variante: VarianteFoto): string {
  return PROMPTS_VARIANTES[variante] || PROMPTS_VARIANTES.estudio
}

export function armarPeticionEdicionImagen({
  imagenBlob,
  variante,
}: {
  imagenBlob: Blob | File
  variante: VarianteFoto
}): FormData {
  const formData = new FormData()
  formData.append('model', 'ayllu-imagen')
  formData.append('image', imagenBlob, 'original.jpg')
  formData.append('prompt', obtenerPromptVariante(variante))
  formData.append('response_format', 'b64_json')
  return formData
}

export interface ResultadoVariantes {
  fotosExitosas: Array<{ variante: VarianteFoto; base64: string }>
  advertencias: string[]
}

export async function procesarVariantesFotos(
  generador: (variante: VarianteFoto) => Promise<{ base64: string }>,
): Promise<ResultadoVariantes> {
  const resultados = await Promise.allSettled(
    VARIANTES_FOTO.map(async (variante) => {
      const res = await generador(variante)
      return { variante, base64: res.base64 }
    }),
  )

  const fotosExitosas: Array<{ variante: VarianteFoto; base64: string }> = []
  const advertencias: string[] = []

  resultados.forEach((res, index) => {
    const variante = VARIANTES_FOTO[index]
    if (res.status === 'fulfilled') {
      fotosExitosas.push(res.value)
    } else {
      advertencias.push(`No se pudo generar la foto «${variante}».`)
    }
  })

  return { fotosExitosas, advertencias }
}
