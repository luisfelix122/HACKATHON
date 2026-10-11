import type { CapacitorConfig } from '@capacitor/cli'

// APK del artesano (docs/cambios/CC-01.md). `appId` es un supuesto: cambiarlo
// antes de publicar en Play Store invalida las instalaciones existentes.
const config: CapacitorConfig = {
  appId: 'pe.ayllu.artesano',
  appName: 'Ayllu',
  webDir: 'dist-artesano',
  plugins: { SystemBars: { insetsHandling: 'native' } },
}

export default config
