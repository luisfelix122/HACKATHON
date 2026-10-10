# CosteARTE

Vitrina digital para artesanos de las playas del norte de Piura y Talara (Hackatón, Reto 17).

- **Comprador y administrador:** web.
- **Artesano:** APK de Android (Capacitor), con borradores sin conexión.
- **Backend:** Supabase. La IA pasa por un proxy LiteLLM, con OpenRouter como respaldo.

## Documentación
| Documento | Contenido |
| --- | --- |
| `docs/proyecto.md` | problema, usuarios, alcance y restricciones |
| `docs/revision-alcance.md` | hechos, hipótesis, demo, sostenibilidad y riesgos |
| `docs/dominio.md` | glosario, estados y reglas de negocio |
| `docs/plan.md` | stack, arquitectura, casos de uso e hitos |
| `docs/contratos.md` | tablas, permisos, funciones y convenciones |
| `docs/decisiones/`, `docs/cambios/` | decisiones (0001 stack, 0002 proxy IA) y cambios de alcance (CC-01 a CC-03) |
| `docs/prp/` | PRP 000–009, uno por caso de uso |

## Arranque
**Requisitos**
- Node ≥ 22 y GNU make.
- Para la APK: Android Studio (SDK con API ≥ 24) y **JDK 21**. El Gradle de Capacitor 8 no acepta el JDK 25 que trae Android Studio.
- Para las pruebas de base de datos: Docker Desktop.

**Variables:** copia `.env.example` a `.env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Los secretos de las Edge Functions (`OPENROUTER_API_KEY`, `IA_BASE_URL`, `IA_API_KEY`, `IA_TIMEOUT_MS`) se configuran con `npx supabase secrets set`, nunca en el repositorio.

| Comando | Qué hace |
| --- | --- |
| `npm ci` | instala las dependencias |
| `npm run dev` | web local |
| `npm run dev -- --mode artesano` | app del artesano en el navegador |
| `make verify` | lint, formato, tipos y pruebas |
| `make build` | genera `dist-web/` y `dist-artesano/` |
| `make apk JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-21…"` | genera `android/app/build/outputs/apk/debug/app-debug.apk` |
| `make test-db` | pruebas pgTAP (requiere Docker y `npx supabase start`) |

**Despliegue:**
- **Web:** Vercel, con `vercel.json` (build `npm run build:web`, salida `dist-web`).
- **APK de debug:** se instala directo en el celular (`adb install` o copiando el archivo).
- **Proxy de IA:** `infra/litellm/` (PRP 009), lo despliega la laptop autorizada.

## Flujo de trabajo
Ver `AGENTS.md` y `CLAUDE.md`: un PRP = una rama = un PR, `make verify` y revisión con el subagente `reviewer`. Las instrucciones de arranque del código llegan con el PRP 000.
