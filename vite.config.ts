/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Una sola base de código, dos salidas: `--mode web` (comprador y admin) y
// `--mode artesano` (APK empaquetada con Capacitor). Ver docs/cambios/CC-01.md.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: mode === 'artesano' ? 'dist-artesano' : 'dist-web',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
}))
