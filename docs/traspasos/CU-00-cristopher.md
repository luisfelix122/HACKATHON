# Traspaso CU-00 — Base web + APK del artesano (PRP 000)

- **Responsable:** Cristopher
- **Rama:** `cu-00/base-web-apk`, desde `main` en `17b5932`
- **PRP:** `docs/prp/000--base-web-apk.md`
- **Dependencias integradas:** ninguna (Fase 0, primer PRP)
- **Fecha:** 2026-10-10

## Archivos
Todos están en la tabla «Archivos» del PRP 000, salvo los indicados.

| Acción | Ruta |
| --- | --- |
| crear | `package.json`, `package-lock.json` |
| crear | `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json` |
| crear | `eslint.config.js`, `.prettierrc.json`, `.prettierignore` |
| crear | `index.html` (`lang="es"`) |
| crear | `src/main.tsx`, `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx`, `src/app/app.test.tsx` |
| crear | `src/compartido/supabase.ts`, `src/compartido/ui/estilos.css` |
| crear | `capacitor.config.ts`, `android/**` (generado por `npx cap add android`, sin ediciones a mano) |
| crear | `supabase/config.toml` y `supabase/.gitignore` (los genera `supabase init`; **`supabase/.gitignore` no está en la tabla**, se pide aprobarlo en el PR) |
| crear | `.github/workflows/ci.yml` |
| modificar | `Makefile`, `README.md`, `.gitignore` |
| crear | `docs/traspasos/CU-00-cristopher.md` (este archivo) |
| **sin modificar** | `.env.example`: las reglas `deny` impiden al agente leerlo o editarlo. Ver «Bloqueos» |

No se tocaron `supabase/seed.sql` (mismo sha1 antes y después de `supabase init`), `.engram/` ni la etiqueta `respaldo-implementacion`.

## Decisiones
- **Selección por modo sin `await` de nivel superior:** `main.tsx` elige `AppArtesano` o `AppWeb` con un `import()` dinámico dentro de un condicional sobre `import.meta.env.MODE`. Vite lo vuelve constante y descarta la rama no usada. Se evitó el `await` de nivel superior para no exigirlo al WebView. `main.tsx` exporta `montada` (la raíz de React) solo para que las pruebas la desmonten.
- **Cliente Supabase al primer uso:** `obtenerSupabase()` crea el cliente la primera vez que se pide; `crearClienteSupabase(entorno)` valida las variables y falla con un mensaje claro. Así «Mis productos» abre sin conexión y sin variables, y los builds de CI no necesitan `.env`. Sesión: `persistSession: true`, `storageKey: 'ayllu.auth'`, `flowType: 'pkce'` (contratos §Acceso).
- **Router:** `BrowserRouter` en ambas salidas. La APK redirige cualquier ruta desconocida a `/` («Mis productos»); la web muestra «Página no encontrada».
- **JDK en `make apk`:** variable `JDK21_HOME` (por defecto la ruta de Temurin 21 de esta laptop) exportada como `JAVA_HOME` solo en la receta. La receta falla con un mensaje claro si `JDK21_HOME` o `ANDROID_HOME` no existen.
- **`gradlew.bat` en Windows:** con `core.autocrlf=true`, un clon nuevo deja `android/gradlew` con CRLF y `sh` no lo ejecuta. El `Makefile` usa `./gradlew.bat` cuando `OS=Windows_NT`. Alternativa recomendada (fuera de la tabla): un `.gitattributes` con `android/gradlew text eol=lf`.
- **`compileSdk`:** se queda en 36 (lo genera Capacitor 8); `platforms/android-36` está instalado, así que `variables.gradle` no cambió.
- **Pruebas del cliente Supabase en `src/app/app.test.tsx`:** `src/compartido/supabase.test.ts` no está en la tabla del PRP. Moverlas ahí requiere aprobación.
- **Dependencias:** las de la tarea 1 del PRP más las herramientas de calidad (ESLint, Prettier, Vitest, Testing Library, jsdom, TypeScript) y `supabase` (CLI, como dependencia de desarrollo). `@types/node` está alineado con Node 22.

## Pruebas y resultados
| Comprobación | Resultado |
| --- | --- |
| `make verify` (lint, format-check, typecheck, test) | exit 0; 12 pruebas pasan |
| `npm run build:web` | exit 0, genera `dist-web/` |
| `npm run build:artesano` | exit 0, genera `dist-artesano/` |
| La APK no incluye la web | `rg` no encuentra «Administración» ni «Página no encontrada» en `dist-artesano/`, ni «Mis productos» en `dist-web/` |
| `make apk` | exit 0, `BUILD SUCCESSFUL`, `android/app/build/outputs/apk/debug/app-debug.apk` (4,3 MB) |
| `npm run preview -- --mode web` | `/`, `/producto/x` y `/admin` responden 200; `/producto/x` muestra «Producto» sin errores en consola (navegador integrado); sin scroll horizontal a 360 px |
| Fallo crítico (variables de Supabase faltantes) | La prueba falló primero con el mensaje genérico `supabaseUrl is required.`; después de la validación muestra «Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY…» |
| Revisión con el subagente `reviewer` | 2 ciclos. Ciclo 1: se corrigieron los hallazgos 5, 6, 9 y 10. Ciclo 2: veredicto «aprobar» para el código, y se corrigieron sus dos hallazgos menores (pantalla en blanco si falla la carga de la App; limpiar el mock entre pruebas). Lo que queda pendiente es manual (ver «Bloqueos») o está en «Seguimiento» |

Pruebas en `src/app/app.test.tsx`:
- `AppWeb` monta `/`, `/producto/:id`, `/admin` y la ruta desconocida.
- `AppArtesano` abre en «Mis productos» vacío, y `/admin` vuelve a «Mis productos».
- `main.tsx` monta la App correcta según `MODE`, falla con un mensaje claro si falta `#root` y, si la App no carga, muestra un aviso (`role="alert"`) en vez de una pantalla en blanco. Esta prueba falló primero, antes de agregar el aviso.
- El cliente Supabase falla si faltan variables y se crea con `persistSession` y `ayllu.auth`.

`webapp-testing` no se usó porque requiere Python, que no está instalado. El recorrido web se comprobó con curl y el navegador integrado.

## Prueba de audio (sección Notas del PRP)
**Pendiente, no se ejecutó.** Requiere la APK en un Android real (para `MediaRecorder.isTypeSupported(...)` en el WebView) y la clave de OpenRouter en una variable local, y el agente no tiene ninguna de las dos. Pasos:
1. Instalar la APK y abrir el inspector remoto (`chrome://inspect` con depuración USB).
2. En la consola, comprobar `['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].map(t => [t, MediaRecorder.isTypeSupported(t)])`.
3. Grabar 5 s en el formato soportado y llamar a OpenRouter (`google/gemini-2.5-flash`, `input_audio` en base64) con la clave en una variable local.
4. Anotar el resultado en la sección Notas del PRP 000.

## Bloqueos
- **`.env.example` (lo hace Cristopher a mano):** el criterio de aceptación pide estas tres variables, sin valores. Contenido exacto para pegar:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_PUBLISHABLE_KEY=
  OPENROUTER_API_KEY=
  ```
  `docs/contratos.md` §Convenciones también nombra `IA_BASE_URL`, `IA_API_KEY` e `IA_TIMEOUT_MS`, que solo usan las Edge Functions. El PRP 000 no las exige; agregarlas es opcional.
- **GitHub:** la línea «GitHub autorizado» del prompt quedó con el marcador sin resolver (`<… | ninguno>`), así que se trató como **no autorizado**. La rama no se subió y el PR no se abrió.

## Pruebas manuales pendientes
- [ ] Instalar `app-debug.apk` en un Android ≥ 7, activar el modo avión y ver «Mis productos» (Cristopher). En Android 7 el WebView del sistema debe estar actualizado desde Play Store, porque el build apunta a navegadores modernos.
- [ ] Prueba de audio (ver arriba) y anotarla en la sección Notas del PRP.
- [ ] Confirmar que el CI pasa en GitHub Actions en el PR.

## Seguimiento (fuera del alcance del PRP 000)
- `android/app/src/main/AndroidManifest.xml`: `allowBackup="true"` deja la sesión indefinida en las copias de seguridad de Android. Proponer `allowBackup="false"` o `dataExtractionRules` en el PRP 001.
- `supabase/config.toml` (generado): `minimum_password_length = 6`, cuando el contrato pide 8; `site_url` y `additional_redirect_urls` apuntan a `127.0.0.1:3000`. Ajustar en el PRP 001.
- `android/app/src/androidTest/` y `android/app/src/test/` son plantillas de Capacitor que esperan `com.getcapacitor.app`. Borrarlas, con aprobación del responsable.
- `npm audit`: 3 vulnerabilidades moderadas en `@capacitor/cli` → `xcode` → `uuid`. Solo afectan a la herramienta de desarrollo, en la ruta de iOS; `npm audit fix --force` bajaría `@capacitor/cli`. Se aceptan por ahora.
- `.gitattributes` con `android/gradlew text eol=lf` (ver «Decisiones»).

## Siguiente paso
1. Pegar las variables en `.env.example` y hacer las pruebas manuales.
2. Si se autoriza GitHub: subir la rama y abrir el PR con el cuerpo preparado.
3. Después del merge: PRP 011 (`cu-11/sistema-visual`).
