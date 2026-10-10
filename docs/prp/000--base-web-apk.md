# PRP 000 — Base web + APK del artesano

- Caso de uso: CU-00 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo
- Rama: `cu-00/base-web-apk`

## Objetivo
Un solo proyecto React + TypeScript + Vite que produce dos salidas, más la verificación de calidad y Supabase inicializado:
- **Web del comprador y del administrador:** desplegada con HTTPS (antes Vercel; desde CC-05 en el servidor propio, PRP 010).
- **APK de debug del artesano:** generada con Capacitor, que se instala en un Android y abre **sin conexión**.

Al terminar, `make verify` ejecuta comprobaciones reales y pasa.

## Por qué
Es la base de todos los PRP. También comprueba temprano los dos riesgos de infraestructura de `docs/plan.md`: compilar Android en esta máquina y que la API de OpenRouter acepte el formato de audio.

## Criterios de aceptación
- [ ] `npm run build:web` genera `dist-web/` y `npm run build:artesano` genera `dist-artesano/`. Cada salida monta solo sus rutas: la APK no incluye la vitrina ni el panel del administrador.
- [ ] `make verify` ejecuta `lint`, `format-check`, `typecheck` y `test` con comandos reales, y termina con código 0. El mismo `make verify` y los dos builds corren en GitHub Actions.
- [ ] `README.md` explica cómo arrancar el proyecto: requisitos, `npm ci`, variables, `npm run dev -- --mode artesano`, `make apk` y despliegue.
- [ ] El subagente `reviewer` se puede invocar con este PRP y el diff.
- [ ] `make apk` genera `android/app/build/outputs/apk/debug/app-debug.apk`.
- [ ] La APK instalada en un Android real (≥ 7) **en modo avión** abre la pantalla «Mis productos» (vacía).
- [ ] La web desplegada (PRP 010 desde CC-05) responde por HTTPS. Una ruta profunda (`/producto/x`) no da 404, gracias al rewrite de la SPA.
- [ ] `supabase/` existe, inicializado con `supabase init`. `.env.example` lista `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `OPENROUTER_API_KEY`, sin valores.
- [ ] Queda anotado en este PRP (sección Notas) el resultado de la prueba de humo de audio en OpenRouter: qué formato graba el WebView de Android y si OpenRouter lo acepta.

## Contexto necesario
- **Dominio:** no aplica todavía.
- **Contratos:** `docs/contratos.md` §Convenciones (variables de entorno).
- **Decisiones:** `docs/decisiones/0001-stack.md`, `docs/cambios/CC-01.md`.
- **Código existente a imitar:** ninguno (repo sin código).
- **Documentación externa:**
  - https://capacitorjs.com/docs/android: `npm install @capacitor/android`, `npx cap add android`; API 24+; se gestiona con Android Studio.
  - https://capacitorjs.com/docs/getting-started: `npx cap init`, `webDir`.
  - https://vitejs.dev/guide/env-and-mode: modos de Vite (`--mode artesano`).
  - https://openrouter.ai/docs/features/multimodal/audio: `input_audio` en base64.
  - https://supabase.com/docs/guides/local-development/cli/getting-started: `supabase init`.
- **Trampas conocidas:**
  - **Java:** no está en el PATH. Android Studio trae JDK 25 en `C:/Program Files/Android/Android Studio/jbr`. Exportar `JAVA_HOME` y `ANDROID_HOME=$LOCALAPPDATA/Android/Sdk` solo para `make apk`. Si el Gradle que genera Capacitor rechaza JDK 25, **detenerse y pedir permiso** para instalar el JDK que exija la versión de Capacitor.
  - **SDK instalado:** `platforms/android-37.0` y `build-tools/36.0.0`. Si el proyecto generado pide otro `compileSdk`, ajustarlo en `android/variables.gradle` o instalar el paquete, pidiendo permiso antes.
  - **Secretos:** nunca escribir valores en `.env.example` ni en `capacitor.config.ts`.
  - **Herramientas del shell:** `python` y `sd` no están instalados. Usar Node para los scripts.
  - **Supabase CLI:** no está instalada globalmente. Agregarla como dependencia de desarrollo (`supabase`) y usar `npx supabase`. `supabase test db` requiere `supabase start`, que usa Docker; Docker Desktop está instalado pero el daemon estaba apagado al revisarlo. `make test-db` falla con un mensaje claro si Docker no corre, sin fingir éxito.
  - **`.env.example`:** una regla de permisos impide leerlo, y sin leerlo el agente no puede editarlo. Cristopher agrega a mano las tres variables listadas, o concede el permiso.
  - **Tiempo de CI:** el CI no compila la APK (requiere el SDK de Android). La APK se compila en local con `make apk`.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `package.json`, `package-lock.json` | dependencias y scripts: `dev`, `build:web`, `build:artesano`, `lint`, `format:check`, `typecheck`, `test` |
| crear | `vite.config.ts` | `outDir` según el modo (`dist-web` / `dist-artesano`) y configuración de Vitest |
| crear | `tsconfig.json`, `tsconfig.node.json` | TypeScript estricto |
| crear | `eslint.config.js`, `.prettierrc.json`, `.prettierignore` | lint y formato |
| crear | `index.html` | punto de entrada |
| crear | `src/main.tsx` | elige `AppWeb` o `AppArtesano` según `import.meta.env.MODE` |
| crear | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx` | router de cada salida con pantallas vacías |
| crear | `src/compartido/supabase.ts` | cliente Supabase a partir de las variables de entorno |
| crear | `src/compartido/ui/estilos.css` | estilos base adaptables (de 360 px a 1440 px) |
| crear | `src/app/app.test.tsx` | prueba de humo de que monta cada App |
| crear | `capacitor.config.ts` | `appId` (`pe.costearte.artesano`, **supuesto**), `appName`, `webDir: 'dist-artesano'` |
| crear | `android/**` | lo genera `npx cap add android`; no se edita a mano salvo `variables.gradle` |
| crear | `supabase/config.toml` | lo genera `supabase init` |
| crear | `vercel.json` | comando de build `build:web`, salida `dist-web` y rewrite de la SPA |
| modificar | `Makefile` | comandos reales de `verify` más los objetivos `build`, `apk` y `test-db` |
| crear | `.github/workflows/ci.yml` | en cada PR y en cada push a `main`: `npm ci`, `make verify`, `npm run build:web` y `npm run build:artesano` |
| modificar | `README.md` | sección inicial «CosteARTE — arranque» (requisitos, variables, comandos y despliegue). No borrar el contenido existente |
| modificar | `.env.example` | nombres de las variables |
| modificar | `.gitignore` | `dist-*/`, `android/app/build/`, `android/.gradle/`, `*.apk`, `*.keystore` |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Crear el proyecto Vite React TS e instalar las dependencias: `react-router-dom`, `@supabase/supabase-js`, `dexie`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/browser` (para abrir enlaces externos, como el de pago), ESLint, Prettier y Vitest con Testing Library. Archivos: `package.json`, `vite.config.ts`, `tsconfig*.json`.
2. Crear `main.tsx` con la selección por modo, y `AppWeb` (rutas `/`, `/producto/:id`, `/admin`) y `AppArtesano` (ruta `/` → «Mis productos»).
3. Configurar ESLint, Prettier y la prueba de humo. Reemplazar los objetivos del `Makefile`:
   - `lint` → `npm run lint`
   - `format-check` → `npm run format:check`
   - `typecheck` → `npm run typecheck`
   - `test` → `npm run test -- --run`
4. Ejecutar `npx cap init` y `npx cap add android`, y crear el objetivo `apk`:
   - `npm run build:artesano`
   - `npx cap sync android`
   - `cd android && ./gradlew assembleDebug`, con `JAVA_HOME` y `ANDROID_HOME` exportados en la receta.
5. Compilar la APK e instalarla en el Android. Probar en modo avión.
6. Ejecutar `supabase init`, actualizar `.env.example` y `.gitignore`, crear `vercel.json` y desplegar en Vercel. El despliegue lo hace Cristopher con su cuenta.
7. Prueba de humo de audio, sin commitear código:
   - En la APK, ejecutar `MediaRecorder.isTypeSupported(...)` para `audio/webm;codecs=opus`, `audio/mp4` y `audio/ogg;codecs=opus`.
   - Con la clave en una variable local, hacer una llamada a OpenRouter (`google/gemini-2.5-flash`) con un audio de 5 s en el formato soportado.
   - Anotar el resultado en Notas.

## Validación
1. `make verify`.
2. **Pruebas a crear:** que `AppWeb` y `AppArtesano` montan sin errores (caso feliz). Que `main.tsx` elige la App correcta según el modo (borde).
3. **Prueba manual:**
   - Instalar `app-debug.apk` (`adb install` o copiándola al celular).
   - Activar el modo avión, abrir la app y ver «Mis productos».
   - Abrir la URL de Vercel en el celular y en la laptop.

## Fuera de alcance
- Login (PRP 001), pantallas reales (PRP 002–006), firma de release y Play Store.
- PWA instalable para el comprador (CC-01).

## Notas / riesgos
- Resultado de la prueba de audio: <pendiente>.
- Versión del JDK usada en la compilación: <pendiente>.
