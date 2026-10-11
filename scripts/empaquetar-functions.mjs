import { build } from 'vite'

// El runtime Deno requiere imports explícitos; se agrupan los módulos locales
// y se conservan únicamente dependencias npm fijadas. No se empaquetan secretos.
const dependencias = {
  '@supabase/supabase-js': 'npm:@supabase/supabase-js@2.117.3',
  zod: 'npm:zod@4.6.5',
}
for (const nombre of ['procesar-producto', 'traducir-mensaje']) {
  await build({
    configFile: false,
    // Sin public/: los bundles solo llevan el handler, no los recursos de la web.
    publicDir: false,
    plugins: [
      {
        name: 'dependencias-deno',
        enforce: 'pre',
        resolveId(id) {
          if (dependencias[id]) return { id: dependencias[id], external: true }
        },
      },
    ],
    build: {
      ssr: 'supabase/functions/' + nombre + '/index.ts',
      target: 'es2022',
      outDir: 'dist-functions/' + nombre,
      emptyOutDir: true,
      minify: false,
      rolldownOptions: { output: { entryFileNames: 'index.ts' } },
    },
  })
}
console.log(
  'Edge Functions listas en dist-functions/. Copiar ambas carpetas al volumen functions del servidor.',
)
