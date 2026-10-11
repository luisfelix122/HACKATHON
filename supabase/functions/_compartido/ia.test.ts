import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { llamarChatIa, llamarEdicionImagenIa, ErrorIaNoDisponible } from './ia'

describe('_compartido/ia.ts - Cliente del proxy LiteLLM', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('llamarChatIa (texto y audio)', () => {
    it('retorna el contenido cuando el proxy responde 200 OK', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: '{"evaluacion":{},"ficha":{},"comentario_precio":""}',
              },
            },
          ],
        }),
      } as unknown as Response)

      const res = await llamarChatIa({
        modelo: 'ayllu-texto',
        systemPrompt: 'Eres un evaluador',
        userPrompt: 'Evalúa esta artesanía',
        imagenBase64: 'abc123foto',
        config: {
          baseUrl: 'http://litellm-proxy.local',
          apiKey: 'secret-key',
          timeoutMs: 1000,
        },
      })

      expect(res).toBe('{"evaluacion":{},"ficha":{},"comentario_precio":""}')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://litellm-proxy.local/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer secret-key',
            'Content-Type': 'application/json',
          }),
        }),
      )
    })

    it('incluye bloque de audio con file y data URI cuando se proporciona audioBase64', async () => {
      interface PeticionChat {
        model?: string
        messages?: Array<{
          role: string
          content: Array<{ type: string; file?: { url: string } }>
        }>
      }
      let peticionBody: PeticionChat | null = null
      globalThis.fetch = vi.fn().mockImplementation(async (_url, opts) => {
        peticionBody = JSON.parse(opts.body) as PeticionChat
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: 'ok' } }],
          }),
        } as unknown as Response
      })

      await llamarChatIa({
        modelo: 'ayllu-audio',
        systemPrompt: 'Audio prompt',
        userPrompt: 'Escucha este audio',
        imagenBase64: 'base64imagen',
        audioBase64: 'base64audio',
        audioMimeType: 'audio/webm',
        config: {
          baseUrl: 'http://litellm-proxy.local',
          apiKey: 'key',
        },
      })

      expect(peticionBody).toBeDefined()
      expect(peticionBody?.model).toBe('ayllu-audio')
      const userMessage = peticionBody?.messages?.find((m) => m.role === 'user')
      const filePart = userMessage?.content.find((p) => p.type === 'file')
      expect(filePart).toBeDefined()
      expect(filePart?.file?.url).toBe('data:audio/webm;base64,base64audio')
    })

    it('lanza ErrorIaNoDisponible con código ia_no_disponible si falta IA_BASE_URL', async () => {
      await expect(
        llamarChatIa({
          modelo: 'ayllu-texto',
          systemPrompt: 'sys',
          userPrompt: 'usr',
          imagenBase64: 'img',
          config: {
            baseUrl: '',
            apiKey: 'key',
          },
        }),
      ).rejects.toThrowError(ErrorIaNoDisponible)
    })

    it('lanza ErrorIaNoDisponible (nunca limite_ia) si el proxy responde con 500, 400 o 429', async () => {
      for (const status of [500, 502, 400, 429]) {
        globalThis.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          statusText: 'Error del proxy',
          json: async () => ({ error: 'cuota agotada o llave en enfriamiento' }),
        } as unknown as Response)

        try {
          await llamarChatIa({
            modelo: 'ayllu-texto',
            systemPrompt: 'sys',
            userPrompt: 'usr',
            imagenBase64: 'img',
            config: {
              baseUrl: 'http://litellm-proxy.local',
              apiKey: 'key',
            },
          })
          expect.fail('Debería haber lanzado error')
        } catch (err: unknown) {
          expect(err).toBeInstanceOf(ErrorIaNoDisponible)
          const errorIa = err as ErrorIaNoDisponible
          expect(errorIa.codigo).toBe('ia_no_disponible')
          expect(errorIa.status).toBe(502)
          expect(errorIa.codigo).not.toBe('limite_ia')
        }
      }
    })

    it('lanza ErrorIaNoDisponible si la llamada excede el tiempo límite (timeout)', async () => {
      globalThis.fetch = vi.fn().mockImplementation((_url, opts) => {
        return new Promise((_, reject) => {
          opts.signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'))
          })
        })
      })

      const inicio = Date.now()
      await expect(
        llamarChatIa({
          modelo: 'ayllu-texto',
          systemPrompt: 'sys',
          userPrompt: 'usr',
          imagenBase64: 'img',
          config: {
            baseUrl: 'http://litellm-proxy.local',
            apiKey: 'key',
            timeoutMs: 50,
          },
        }),
      ).rejects.toThrowError(ErrorIaNoDisponible)
      const transcurrido = Date.now() - inicio
      expect(transcurrido).toBeLessThan(1000)
    })
  })

  describe('llamarEdicionImagenIa (variantes de foto)', () => {
    it('envía petición multipart a /v1/images/edits y retorna b64_json', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ b64_json: 'edit_image_b64' }],
        }),
      } as unknown as Response)

      const blob = new Blob(['bytes'], { type: 'image/jpeg' })
      const res = await llamarEdicionImagenIa({
        imagenBlob: blob,
        prompt: 'Foto de estudio',
        config: {
          baseUrl: 'http://litellm-proxy.local',
          apiKey: 'key',
        },
      })

      expect(res.b64_json).toBe('edit_image_b64')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://litellm-proxy.local/v1/images/edits',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer key',
          }),
        }),
      )
    })

    it('lanza error si la edición de imagen falla o excede el timeout', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Error',
      } as unknown as Response)

      const blob = new Blob(['bytes'], { type: 'image/jpeg' })
      await expect(
        llamarEdicionImagenIa({
          imagenBlob: blob,
          prompt: 'Foto de estudio',
          config: {
            baseUrl: 'http://litellm-proxy.local',
            apiKey: 'key',
          },
        }),
      ).rejects.toThrow()
    })
  })
})
