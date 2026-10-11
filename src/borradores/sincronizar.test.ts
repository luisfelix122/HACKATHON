import type { SupabaseClient } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BorradorLocal } from './db'
import { sincronizarBorrador, sincronizarTodosLosBorradores } from './sincronizar'

// Mock de la base de datos Dexie local con nombre de tabla de dominio borrador_local
const mockBorradores = new Map<string, BorradorLocal>()

vi.mock('./db', () => ({
  db: {
    borrador_local: {
      get: vi.fn(async (id: string) => mockBorradores.get(id)),
      put: vi.fn(async (b: BorradorLocal) => {
        mockBorradores.set(b.id, b)
        return b.id
      }),
      delete: vi.fn(async (id: string) => {
        mockBorradores.delete(id)
      }),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          filter: vi.fn((fn: (b: BorradorLocal) => boolean) => ({
            toArray: vi.fn(async () => Array.from(mockBorradores.values()).filter(fn)),
          })),
          toArray: vi.fn(async () => Array.from(mockBorradores.values())),
        })),
      })),
    },
  },
}))

describe('sincronización de borradores locales a Supabase (PRP 002)', () => {
  let borradorEjemplo: BorradorLocal

  beforeEach(() => {
    vi.clearAllMocks()
    mockBorradores.clear()

    borradorEjemplo = {
      id: 'prod-uuid-1',
      artesano_id: 'art-uuid-1',
      nombre: 'Manta telar norteña',
      descripcion_texto: 'Hermosa manta tejida en telar tradicional con algodón nativo.',
      audio_blob: new Blob(['audio simulado'], { type: 'audio/webm' }),
      audio_mime: 'audio/webm',
      audio_ruta: null,
      foto_blob: new Blob(['foto simulada'], { type: 'image/jpeg' }),
      foto_id: 'foto-uuid-1',
      costeo: {
        materiales: 20,
        horas: 5,
        pago_hora: 10,
        gastos: 5,
        ganancia: 25,
      },
      precio_final: 100,
      disponibilidad: 'en_stock',
      plazo_dias: null,
      estado_sincronizacion: 'pendiente',
      error_sincronizacion: null,
      creado_en: '2026-10-10T12:00:00Z',
      actualizado_en: '2026-10-10T12:00:00Z',
    }
    mockBorradores.set(borradorEjemplo.id, { ...borradorEjemplo })
  })

  function crearMockSupabase({
    errorFoto = null as Error | null,
    errorAudio = null as Error | null,
    errorProducto = null as Error | null,
    errorFotoProducto = null as Error | null,
  } = {}) {
    const uploadFotoMock = vi.fn().mockResolvedValue({
      data: errorFoto ? null : { path: 'art-uuid-1/prod-uuid-1/original.jpg' },
      error: errorFoto,
    })

    const uploadAudioMock = vi.fn().mockResolvedValue({
      data: errorAudio ? null : { path: 'art-uuid-1/prod-uuid-1/descripcion.webm' },
      error: errorAudio,
    })

    const upsertProductoMock = vi.fn().mockResolvedValue({
      data: errorProducto ? null : [{ id: 'prod-uuid-1' }],
      error: errorProducto,
    })

    const upsertFotoProductoMock = vi.fn().mockResolvedValue({
      data: errorFotoProducto ? null : [{ id: 'foto-uuid-1' }],
      error: errorFotoProducto,
    })

    const supabase = {
      storage: {
        from: vi.fn((bucket: string) => {
          if (bucket === 'fotos') {
            return { upload: uploadFotoMock }
          }
          if (bucket === 'audios') {
            return { upload: uploadAudioMock }
          }
          return { upload: vi.fn() }
        }),
      },
      from: vi.fn((tabla: string) => {
        if (tabla === 'producto') {
          return { upsert: upsertProductoMock }
        }
        if (tabla === 'foto_producto') {
          return { upsert: upsertFotoProductoMock }
        }
        return { upsert: vi.fn() }
      }),
    }

    return {
      supabase,
      uploadFotoMock,
      uploadAudioMock,
      upsertProductoMock,
      upsertFotoProductoMock,
    }
  }

  it('caso feliz: sincroniza foto, audio, producto y foto_producto sin sobreescribir campos de IA', async () => {
    const {
      supabase,
      uploadFotoMock,
      uploadAudioMock,
      upsertProductoMock,
      upsertFotoProductoMock,
    } = crearMockSupabase()

    const resultado = await sincronizarBorrador(
      borradorEjemplo,
      supabase as unknown as SupabaseClient,
    )

    expect(resultado.exito).toBe(true)
    expect(uploadFotoMock).toHaveBeenCalledWith(
      'art-uuid-1/prod-uuid-1/original.jpg',
      borradorEjemplo.foto_blob,
      expect.objectContaining({ upsert: true, contentType: 'image/jpeg' }),
    )
    expect(uploadAudioMock).toHaveBeenCalledWith(
      'art-uuid-1/prod-uuid-1/descripcion.webm',
      borradorEjemplo.audio_blob,
      expect.objectContaining({ upsert: true, contentType: 'audio/webm' }),
    )

    // El artesano no escribe revision_ia ni ia_intentos (docs/contratos.md §Permisos)
    const payloadProducto = upsertProductoMock.mock.calls[0]?.[0]
    expect(payloadProducto).toBeDefined()
    expect(payloadProducto?.revision_ia).toBeUndefined()
    expect(payloadProducto?.ia_intentos).toBeUndefined()
    expect(payloadProducto?.nombre).toBe('Manta telar norteña')
    expect(payloadProducto?.precio_final).toBe(100)

    expect(upsertFotoProductoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'foto-uuid-1',
        producto_id: 'prod-uuid-1',
        origen: 'original',
        publicada: true,
        posicion: 0,
      }),
    )

    const borradorActualizado = mockBorradores.get('prod-uuid-1')
    expect(borradorActualizado?.estado_sincronizacion).toBe('sincronizado')
    expect(borradorActualizado?.error_sincronizacion).toBeNull()
  })

  it('si la subida de foto falla, detiene el proceso y marca error sin subir producto', async () => {
    const { supabase, upsertProductoMock } = crearMockSupabase({
      errorFoto: new Error('Error al conectar con storage fotos'),
    })

    const resultado = await sincronizarBorrador(
      borradorEjemplo,
      supabase as unknown as SupabaseClient,
    )

    expect(resultado.exito).toBe(false)
    expect(resultado.error).toContain('fotos')
    expect(upsertProductoMock).not.toHaveBeenCalled()

    const borradorActualizado = mockBorradores.get('prod-uuid-1')
    expect(borradorActualizado?.estado_sincronizacion).toBe('error')
    expect(borradorActualizado?.error_sincronizacion).toBeTruthy()
  })

  it('si el upsert del producto falla, marca error y conserva borrador pendiente de reintento', async () => {
    const { supabase, upsertFotoProductoMock } = crearMockSupabase({
      errorProducto: new Error('Error de clave o red en tabla producto'),
    })

    const resultado = await sincronizarBorrador(
      borradorEjemplo,
      supabase as unknown as SupabaseClient,
    )

    expect(resultado.exito).toBe(false)
    expect(upsertFotoProductoMock).not.toHaveBeenCalled()

    const borradorActualizado = mockBorradores.get('prod-uuid-1')
    expect(borradorActualizado?.estado_sincronizacion).toBe('error')
    expect(borradorActualizado?.error_sincronizacion).toBeTruthy()
  })

  it('si el upsert de foto_producto falla, marca error', async () => {
    const { supabase } = crearMockSupabase({
      errorFotoProducto: new Error('Error en tabla foto_producto'),
    })

    const resultado = await sincronizarBorrador(
      borradorEjemplo,
      supabase as unknown as SupabaseClient,
    )

    expect(resultado.exito).toBe(false)
    const borradorActualizado = mockBorradores.get('prod-uuid-1')
    expect(borradorActualizado?.estado_sincronizacion).toBe('error')
  })

  it('idempotencia: reintentar no duplica y actualiza con éxito', async () => {
    const { supabase, upsertProductoMock, upsertFotoProductoMock } = crearMockSupabase()

    // Primera ejecución
    const res1 = await sincronizarBorrador(borradorEjemplo, supabase as unknown as SupabaseClient)
    expect(res1.exito).toBe(true)

    // Reintento idéntico
    const res2 = await sincronizarBorrador(borradorEjemplo, supabase as unknown as SupabaseClient)
    expect(res2.exito).toBe(true)

    // Las llamadas usan upsert con los mismos IDs
    expect(upsertProductoMock).toHaveBeenCalledTimes(2)
    expect(upsertFotoProductoMock).toHaveBeenCalledTimes(2)
  })

  it('sincronizarTodosLosBorradores sincroniza solo los borradores pendientes o con error', async () => {
    const { supabase } = crearMockSupabase()

    // Agregar un borrador ya sincronizado
    const borradorYaSincronizado: BorradorLocal = {
      ...borradorEjemplo,
      id: 'prod-uuid-ya-sinc',
      estado_sincronizacion: 'sincronizado',
    }
    mockBorradores.set(borradorYaSincronizado.id, borradorYaSincronizado)

    const resultados = await sincronizarTodosLosBorradores(
      'art-uuid-1',
      supabase as unknown as SupabaseClient,
    )

    // Solo debe sincronizar borradorEjemplo (que está pendiente), no el ya sincronizado
    expect(resultados).toHaveLength(1)
    expect(resultados[0]?.id).toBe('prod-uuid-1')
    expect(resultados[0]?.exito).toBe(true)
  })
})
