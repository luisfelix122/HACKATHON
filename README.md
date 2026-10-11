# Ayllu

Vitrina digital para artesanos de las playas del norte de Piura y Talara (Hackatón, Reto 17).

- **Comprador y administrador:** web.
- **Artesano:** APK de Android (Capacitor), con borradores sin conexión.
- **Backend:** Supabase. La IA (Gemini) pasa por un proxy LiteLLM, sin respaldo (CC-12).

## Ayllu — arranque

### Requisitos
- Node.js 22 o superior y npm.
- GNU make (`winget install ezwinports.make` en Windows).
- Docker Desktop, solo para Supabase local (`npx supabase start`) y `make test-db`.
- Para la APK: SDK de Android (Android Studio) y **JDK 21** (`winget install EclipseAdoptium.Temurin.21.JDK`). El JDK 25 de Android Studio no funciona con el Gradle de Capacitor 8.

### Instalar y configurar
```bash
npm ci
cp .env.example .env.local
```
Completa en `.env.local`:

| Variable | Dónde se usa |
| --- | --- |
| `VITE_SUPABASE_URL` | cliente (web y APK) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | cliente (web y APK); es la clave publicable, nunca la `service_role` |
| `IA_BASE_URL`, `IA_API_KEY`, `IA_TIMEOUT_MS` | solo en las Edge Functions (proxy LiteLLM), nunca en el cliente |

Con Supabase local, `npx supabase start` imprime la URL y la clave publicable.

### Comandos
| Comando | Qué hace |
| --- | --- |
| `npm run dev -- --mode web` | web del comprador y del administrador en modo desarrollo |
| `npm run dev -- --mode artesano` | pantallas de la APK del artesano en el navegador |
| `make verify` | lint, formato, tipos y pruebas (también corre en GitHub Actions) |
| `npm run build:web` | genera `dist-web/` |
| `npm run build:artesano` | genera `dist-artesano/` (sin la vitrina ni el panel del administrador) |
| `npm run preview -- --mode web` | sirve `dist-web/`; las rutas profundas como `/producto/x` funcionan |
| `make apk` | genera `android/app/build/outputs/apk/debug/app-debug.apk`. Si tu JDK 21 está en otra ruta: `make apk JDK21_HOME=/ruta/jdk-21` |
| `make test-db` | pruebas pgTAP de la base (requiere Docker y `npx supabase start`) |

### Despliegue
La guía del operador está en [infra/supabase/README.md](infra/supabase/README.md)
(PRP 010). Configura Supabase compartido, acceso privado de administración,
migraciones, validaciones de las ramas y respaldos. Los integrantes pueden
desarrollar sin Docker local usando la URL y la clave publicable del servidor;
las pruebas SQL las coordina el operador. El despliegue sigue pendiente.

La web se publica copiando `dist-web/` al servidor propio con HTTPS. El Caddyfile
de `infra/web/` resuelve las rutas profundas de la SPA. La APK de debug se instala
con `adb install android/app/build/outputs/apk/debug/app-debug.apk` o copiándola al
celular, compilada con la URL de Supabase del servidor.

## Documentación
| Documento | Contenido |
| --- | --- |
| `docs/proyecto.md` | problema, usuarios, alcance y restricciones |
| `docs/revision-alcance.md` | hechos, hipótesis, demo, sostenibilidad y riesgos |
| `docs/dominio.md` | glosario, estados y reglas de negocio |
| `docs/plan.md` | stack, arquitectura, casos de uso e hitos |
| `docs/contratos.md` | tablas, permisos, funciones y convenciones |
| `docs/decisiones/`, `docs/cambios/` | decisiones (0001 a 0004) y cambios de alcance (CC-01 a CC-08) |
| `docs/prp/` | PRP 000–011, uno por caso de uso |
| `PRODUCT.md`, `DESIGN.md` | datos del producto y sistema visual (skill impeccable) |

## Estado
La base web + APK (PRP 000) está implementada; los demás PRP se implementan uno por uno. Una implementación anterior de los PRP 000, 001 y 011 quedó guardada en la etiqueta de git `respaldo-implementacion` como referencia; para recuperar un archivo: `git checkout respaldo-implementacion -- <ruta>`.

Las instrucciones de arranque están en «Ayllu — arranque». Dato ya comprobado: para compilar la APK con Capacitor 8 hace falta **JDK 21**, porque el JDK 25 de Android Studio no funciona con su Gradle.

## Flujo de trabajo
Ver `AGENTS.md` y `CLAUDE.md`: un PRP = una rama = un PR, `make verify` y revisión con el subagente `reviewer`.
