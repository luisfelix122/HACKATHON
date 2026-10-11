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
    // Limpia el DOM entre pruebas (PRP 012).
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'supabase/functions/**/*.test.ts'],
    // Vitest devuelve vacío el CSS importado; tokens.css se lee de verdad para
    // comprobar el contraste AA de la paleta (PRP 011, aprobado por Cristopher).
    css: { include: [/\/compartido\/ui\/tokens\.css/] },
  },
}))
