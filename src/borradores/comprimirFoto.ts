/**
 * Comprime y redimensiona una imagen para cumplir con los contratos del sistema:
 * - Lado mayor escalado proporcionalmente a un máximo de 1600 px.
 * - Formato de compresión: image/jpeg con calidad 0.8 (docs/contratos.md §Archivos).
 */
export async function comprimirFoto(
  origen: Blob | File | string,
  ladoMayorMaximo = 1600,
  calidad = 0.8,
): Promise<Blob> {
  // En entornos sin DOM (por ejemplo, Node básico), retornar un Blob simulado
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    if (typeof origen === 'string') {
      return new Blob([origen], { type: 'image/jpeg' })
    }
    return origen
  }

  let urlLiberable: string | null = null
  let src: string

  if (typeof origen === 'string') {
    src =
      origen.startsWith('data:') || origen.startsWith('http') || origen.startsWith('blob:')
        ? origen
        : `data:image/jpeg;base64,${origen}`
  } else {
    src = URL.createObjectURL(origen)
    urlLiberable = src
  }

  try {
    const imagen = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('No se pudo cargar la imagen para compresión'))
      img.src = src
    })

    let ancho = imagen.naturalWidth || imagen.width
    let alto = imagen.naturalHeight || imagen.height

    if (ancho <= 0 || alto <= 0) {
      throw new Error('Dimensiones de imagen inválidas')
    }

    if (ancho > ladoMayorMaximo || alto > ladoMayorMaximo) {
      if (ancho >= alto) {
        alto = Math.round((alto * ladoMayorMaximo) / ancho)
        ancho = ladoMayorMaximo
      } else {
        ancho = Math.round((ancho * ladoMayorMaximo) / alto)
        alto = ladoMayorMaximo
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = ancho
    canvas.height = alto

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('No se pudo obtener el contexto 2D del canvas')
    }

    ctx.drawImage(imagen, 0, 0, ancho, alto)

    const blobComprimido = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Fallo al comprimir imagen en canvas'))
          }
        },
        'image/jpeg',
        calidad,
      )
    })

    return blobComprimido
  } finally {
    if (urlLiberable) {
      URL.revokeObjectURL(urlLiberable)
    }
  }
}
