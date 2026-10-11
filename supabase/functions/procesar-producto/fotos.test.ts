import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { handler } from './index'
import { llamarChatIa, llamarEdicionImagenIa } from '../_compartido/ia'
const sdk = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: sdk.createClient }))
vi.mock('../_compartido/ia', async (original) => ({
  ...(await original<typeof import('../_compartido/ia')>()),
  llamarChatIa: vi.fn(),
  llamarEdicionImagenIa: vi.fn(),
}))
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

describe('orquestación HTTP de fotos y recuperación del producto', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  const dueno = '22222222-2222-4222-8222-222222222222'
  let producto: Record<string, unknown>
  let falloFinal: boolean
  let falloFoto: boolean
  let descargas: string[]
  let adquisiciones: number
  beforeEach(() => {
    vi.clearAllMocks()
    falloFinal = false
    falloFoto = false
    descargas = []
    adquisiciones = 0
    producto = {
      id,
      artesano_id: dueno,
      nombre: 'Pieza',
      descripcion_texto: 'A mano',
      audio_ruta: null,
      estado: 'borrador',
      ia_intentos: 0,
      precio_final: 10,
      costeo: null,
    }
    vi.stubGlobal('Deno', {
      env: {
        get: (k: string) =>
          (
            ({
              SUPABASE_URL: 'http://localhost',
              SUPABASE_ANON_KEY: 'anon-simulada',
              SUPABASE_SERVICE_ROLE_KEY: 'service-simulada',
            }) as Record<string, string>
          )[k],
      },
    })
    const blob = new Blob(['foto'], { type: 'image/jpeg' })
    Object.defineProperty(blob, 'arrayBuffer', {
      value: async () => new TextEncoder().encode('foto').buffer,
    })
    const from = (tabla: string) => {
      let cambio: Record<string, unknown> | undefined
      let insercion = false
      const filtros: [string, unknown][] = []
      const ejecutar = async () => {
        if (tabla === 'foto_producto')
          return {
            data: { id: 'foto', ruta: `${dueno}/${id}/original.jpg` },
            error: insercion && falloFoto ? { message: 'fallo registro foto' } : null,
          }
        if (!cambio) return { data: { ...producto }, error: null }
        if (!filtros.every(([k, v]) => producto[k] === v)) return { data: null, error: null }
        if (falloFinal && cambio.estado === 'en_revision')
          return { data: null, error: { message: 'fallo guardar ficha' } }
        Object.assign(producto, cambio)
        if (cambio.estado === 'procesando') adquisiciones++
        return { data: { id }, error: null }
      }
      const consulta = {
        select: () => consulta,
        eq: (k: string, v: unknown) => {
          filtros.push([k, v])
          return consulta
        },
        update: (v: Record<string, unknown>) => {
          cambio = v
          return consulta
        },
        insert: () => {
          insercion = true
          return consulta
        },
        delete: () => consulta,
        single: ejecutar,
        maybeSingle: ejecutar,
        then: (resolve: (v: unknown) => unknown, reject: (v: unknown) => unknown) =>
          ejecutar().then(resolve, reject),
      }
      return consulta
    }
    sdk.createClient.mockReturnValue({
      auth: { getUser: async () => ({ data: { user: { id: dueno } }, error: null }) },
      from,
      storage: {
        from: () => ({
          download: async (ruta: string) => {
            descargas.push(ruta)
            return { data: blob, error: null }
          },
          upload: async () => ({ error: null }),
        }),
      },
    })
    vi.mocked(llamarChatIa).mockResolvedValue(
      JSON.stringify({
        evaluacion: { es_artesania: true, contenido_apropiado: true, motivo: 'Prueba' },
        ficha: {
          titulo: 'Pieza',
          descripcion: 'A mano',
          materiales: ['Algodón'],
          tecnica: 'Tejido',
          tipo_producto: 'textil',
          historia_pieza: '',
          etiquetas: [],
        },
        comentario_precio: 'Referencia',
      }),
    )
    vi.mocked(llamarEdicionImagenIa).mockResolvedValue({ b64_json: btoa('imagen') })
  })
  afterEach(() => vi.unstubAllGlobals())
  function peticion(mejorar = false) {
    return new Request('http://localhost/procesar-producto', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-simulado', 'Content-Type': 'application/json' },
      body: JSON.stringify({ producto_id: id, mejorar_foto: mejorar }),
    })
  }
  it('rechaza audio de otro dueño antes de descargarlo o enviarlo al proxy', async () => {
    producto.descripcion_texto = null
    producto.audio_ruta = `otro/${id}/descripcion.webm`
    expect((await handler(peticion())).status).toBe(400)
    expect(descargas).not.toContain(producto.audio_ruta)
    expect(llamarChatIa).not.toHaveBeenCalled()
  })
  it('acepta audio mp4 canónico con MIME audio/mp4', async () => {
    producto.descripcion_texto = null
    producto.audio_ruta = `${dueno}/${id}/descripcion.mp4`
    expect((await handler(peticion())).status).toBe(200)
    expect(llamarChatIa).toHaveBeenCalledWith(
      expect.objectContaining({ audioMimeType: 'audio/mp4' }),
    )
  })
  it('recupera borrador si falla guardar la ficha', async () => {
    falloFinal = true
    expect((await handler(peticion())).status).toBe(502)
    expect(producto.estado).toBe('borrador')
  })
  it('una variante con base64 inválido produce advertencia sin perder ficha', async () => {
    vi.mocked(llamarEdicionImagenIa).mockResolvedValue({ b64_json: '%%%invalido%%%' })
    const respuesta = await handler(peticion(true))
    expect(respuesta.status).toBe(200)
    expect((await respuesta.json()).advertencias).toHaveLength(4)
    expect(producto.estado).toBe('en_revision')
  })
  it('avisa si se sube una variante pero falla su fila', async () => {
    falloFoto = true
    const respuesta = await handler(peticion(true))
    expect(respuesta.status).toBe(200)
    expect((await respuesta.json()).advertencias).toHaveLength(4)
  })
  it('solo una petición concurrente adquiere procesamiento', async () => {
    const respuestas = await Promise.all([handler(peticion()), handler(peticion())])
    expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409])
    expect(adquisiciones).toBe(1)
    expect(llamarChatIa).toHaveBeenCalledTimes(1)
  })
})
