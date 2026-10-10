import type { CapacitorConfig } from '@capacitor/cli'

// APK del artesano (docs/cambios/CC-01.md). `appId` provisional: cambiarlo
// antes de publicar en Play Store invalida las instalaciones existentes.
const config: CapacitorConfig = {
  appId: 'pe.costearte.artesano',
  appName: 'CosteARTE',
  webDir: 'dist-artesano',
}

export default config
