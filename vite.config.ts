/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Solo admite credenciales destinadas al cliente. No valida la firma del JWT;
// Supabase verifica la credencial al recibir la petición.
export function validarEntornoPublico(env: Record<string, string | undefined>): void {
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  try {
    const parsed = new URL(url)
    if (
      !['https:', 'http:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    )
      throw new Error()
  } catch {
    throw new Error('VITE_SUPABASE_URL no es una URL HTTP válida')
  }
  let publica = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key)
  if (!publica && key.split('.').length === 3) {
    try {
      const payload: unknown = JSON.parse(
        Buffer.from(key.split('.')[1], 'base64url').toString('utf8'),
      )
      publica =
        typeof payload === 'object' &&
        payload !== null &&
        'role' in payload &&
        payload.role === 'anon'
    } catch {
      publica = false
    }
  }
  if (!publica)
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY debe ser publicable o anon, nunca privilegiada')
}

// Una sola base de código, dos salidas: `--mode web` (comprador y admin) y
// `--mode artesano` (APK empaquetada con Capacitor). Ver docs/cambios/CC-01.md.
export default defineConfig(({ mode, command }) => {
  if (command === 'build') validarEntornoPublico(loadEnv(mode, process.cwd(), 'VITE_'))
  return {
    plugins: [react()],
    build: {
      outDir: mode === 'artesano' ? 'dist-artesano' : 'dist-web',
      emptyOutDir: true,
    },
    test: {
      environment: 'jsdom',
      // Limpia el DOM entre pruebas (PRP 012).
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
      // Vitest devuelve vacío el CSS importado; tokens.css se lee de verdad para
      // comprobar el contraste AA de la paleta (PRP 011, aprobado por Cristopher).
      css: { include: [/\/compartido\/ui\/tokens\.css/] },
    },
  }
})
