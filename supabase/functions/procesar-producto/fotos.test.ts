import { describe, it, expect } from 'vitest'
import {
  VARIANTES_FOTO,
  obtenerPromptVariante,
  armarPeticionEdicionImagen,
  procesarVariantesFotos,
  type VarianteFoto,
} from './fotos'

describe('fotos.ts - generación de variantes de imagen', () => {
  it('contiene las 4 variantes de foto según el contrato', () => {
    expect(VARIANTES_FOTO).toEqual(['estudio', 'luz', 'vitrina', 'contexto'])
  })

  it('cada prompt de variante exige explícitamente conservar forma, colores y textura', () => {
    for (const variante of VARIANTES_FOTO) {
      const prompt = obtenerPromptVariante(variante)
      expect(prompt.length).toBeGreaterThan(20)
      const promptMin = prompt.toLowerCase()
      expect(promptMin).toMatch(/conserva|mantiene/)
      expect(promptMin).toContain('forma')
      expect(promptMin).toContain('color')
      expect(promptMin).toContain('textura')
    }
  })

  it('arma la petición FormData con model ayllu-imagen, prompt y la imagen', () => {
    const fakeBlob = new Blob(['fake image bytes'], { type: 'image/jpeg' })
    const formData = armarPeticionEdicionImagen({
      imagenBlob: fakeBlob,
      variante: 'estudio',
    })

    expect(formData.get('model')).toBe('ayllu-imagen')
    expect(formData.get('prompt')).toBe(obtenerPromptVariante('estudio'))
    expect(formData.get('image')).toBeDefined()
  })

  it('procesa las 4 variantes en paralelo y devuelve 4 fotos exitosas sin advertencias', async () => {
    const fakeGenerador = async (variante: VarianteFoto) => {
      return { base64: `base64_data_${variante}` }
    }

    const resultado = await procesarVariantesFotos(fakeGenerador)

    expect(resultado.fotosExitosas).toHaveLength(4)
    expect(resultado.advertencias).toHaveLength(0)
    expect(resultado.fotosExitosas.map((f) => f.variante)).toEqual([
      'estudio',
      'luz',
      'vitrina',
      'contexto',
    ])
    expect(resultado.fotosExitosas[0].base64).toBe('base64_data_estudio')
  })

  it('si 1 variante falla, devuelve 3 fotos y 1 advertencia específica', async () => {
    const fakeGenerador = async (variante: VarianteFoto) => {
      if (variante === 'contexto') {
        throw new Error('Timeout al generar imagen de contexto')
      }
      return { base64: `base64_data_${variante}` }
    }

    const resultado = await procesarVariantesFotos(fakeGenerador)

    expect(resultado.fotosExitosas).toHaveLength(3)
    expect(resultado.advertencias).toHaveLength(1)
    expect(resultado.advertencias[0]).toContain('contexto')
    expect(resultado.fotosExitosas.find((f) => f.variante === 'contexto')).toBeUndefined()
  })

  it('si todas las variantes fallan, devuelve 0 fotos y 4 advertencias sin lanzar excepción', async () => {
    const fakeGenerador = async () => {
      throw new Error('Servicio de imagen ocupado')
    }

    const resultado = await procesarVariantesFotos(fakeGenerador)

    expect(resultado.fotosExitosas).toHaveLength(0)
    expect(resultado.advertencias).toHaveLength(4)
    for (const variante of VARIANTES_FOTO) {
      expect(resultado.advertencias.some((adv) => adv.includes(variante))).toBe(true)
    }
  })
})
