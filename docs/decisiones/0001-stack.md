# 0001 — Stack del MVP

- Fecha: 2026-10-10 (revisada por `docs/cambios/CC-01.md`; Supabase Cloud y Vercel reemplazados por `0003` / CC-05)
- Estado: aceptada
- Decide: equipo · Consultados: <mentor, si se consulta>

## Contexto
CosteARTE tiene dos experiencias:
- **Comprador y administrador:** una página web.
- **Artesano:** una **APK de Android** (CC-01).

El artesano tiene que poder crear un borrador sin conexión, con foto y voz, y la IA lo procesa cuando vuelve la señal. La IA disponible es Gemini vía OpenRouter, restricción oficial de la hackatón.

Comprador y artesano entran con Google. Quedan 15 h y somos 5 personas: conviene no escribir ni desplegar un servidor propio y no mantener dos bases de código.

Alcance aprobado: `docs/revision-alcance.md`.

## Alternativas
**Backend**
| Opción | A favor | En contra |
| --- | --- | --- |
| **Supabase** | Login con Google, Postgres, archivos y reglas de acceso por fila en un solo servicio. Postgres modela bien los estados de la orden y la reserva de stock. | La sincronización sin conexión hay que programarla: almacenamiento local más una cola de subida. |
| Firebase | Firestore sincroniza sin conexión de forma nativa. | No es relacional, así que la reserva y los estados quedan incómodos. Los archivos de Storage no se sincronizan solos. |
| Backend propio | Control total. | Más código, más despliegue y más puntos de falla para 15 h. |

**APK del artesano**
| Opción | A favor | En contra |
| --- | --- | --- |
| **Capacitor sobre la misma app React** | Una sola base de código. La interfaz viaja dentro de la APK, así que abre sin conexión sin depender del service worker. Da acceso a plugins nativos (voz, cámara, archivos). | Requiere Android Studio y JDK en al menos una máquina. Requiere Android Studio y JDK (el deep link de Google quedó descartado por CC-03). |
| TWA (Bubblewrap) | Empaqueta la web tal cual. | Sigue dependiendo del service worker para funcionar sin conexión, requiere Digital Asset Links en el dominio y no da acceso a APIs nativas. |
| React Native / Expo | Nativo real. | Segunda base de código: inviable en 15 h. |

## Decisión
- **Código:** un solo proyecto React + TypeScript + Vite.
  - **Comprador y administrador:** se despliega como web en ~~Vercel Hobby~~ el servidor propio (**reemplazado por 0003 / CC-05**).
  - **Artesano:** se empaqueta como **APK de Android con Capacitor**, que incluye solo las rutas del artesano. Mínimo Android 7 (API 24).
- **Borrador sin conexión (APK):** IndexedDB mediante Dexie, dentro del WebView, para los datos y la foto. Si el tamaño de los archivos da problemas, se evalúa el plugin Filesystem de Capacitor.
- **Backend:** Supabase.
  - Auth con el proveedor Google.
  - Postgres con RLS.
  - Storage para fotos y audios.
  - Edge Functions para las llamadas a la IA (proxy LiteLLM con Gemini desde CC-12). La clave nunca llega al cliente.
- **Login del artesano en la APK:** correo y contraseña (`signInWithPassword`). La cuenta se crea con Google en la web y ahí se define la contraseña (**reemplazado por CC-03**; antes era Google por deep link). **Vigente:** CC-06, CC-08 y CC-09, todo en la APK; ver PRP 001.
- **Descripción hablada (vía combinada):**
  - **Con conexión:** dictado en vivo con el reconocimiento de voz nativo de Android mediante el plugin `@capacitor-community/speech-recognition`. A la IA solo llega **texto**.
  - **Sin conexión:** se graba el audio y se guarda en el borrador. Al recuperar la señal, el artesano lo dicta de nuevo o la Edge Function envía el audio a Gemini por el proxy (CC-12). Esta segunda opción solo se usa si la prueba de formato de la hora 1 funciona.
  - **Siempre:** el artesano puede escribir o corregir el texto a mano.
- **Dispositivo prioritario:** Android para el artesano. La web del comprador debe funcionar bien en celular y en laptop.
- **Distribución de la APK:** instalación directa (sideload) en los celulares de la demo. Google Play queda fuera del MVP.
- **Verificación:** ESLint, Prettier (`--check`), `tsc --noEmit` y Vitest, conectados a `make verify` en el PRP 000.

## Motivo
Supabase es la opción que menos código de servidor exige y cubre los cuatro requisitos duros:
- Login con Google.
- Datos relacionales para pedidos y reserva.
- Archivos.
- Una clave de IA protegida.

Capacitor genera la APK sin una segunda base de código. Además, que la interfaz viaje dentro de la APK resuelve la apertura sin conexión mejor que una PWA.

El trabajo sin conexión se acota a un borrador por dispositivo, con un solo sentido de sincronización (dispositivo → servidor). Así no hace falta resolver conflictos.

## Consecuencias
- **Positivas:**
  - Autenticación y almacenamiento sin servidor propio.
  - Una sola base de código para la web y la APK.
  - URL de vista previa por rama para la web.
  - Los permisos por rol viven en la base de datos (RLS).
- **Negativas / costos:**
  - Se suma la configuración de Android: Android Studio o JDK, firma de la APK y deep link. Estimado en 2–3 h-persona; **no está medido**.
  - Instalar la APK obliga a permitir "orígenes desconocidos" en el celular.
  - Dependencia de un proveedor externo.
  - Límites y riesgos en «Verificación».
- **Qué cambia en otros documentos:**
  - `docs/plan.md`.
  - `Makefile` (comandos reales de `verify` y objetivo para compilar la APK, en el PRP 000).
  - `.env.example` con los nombres de las variables, sin valores.

## Verificación (2026-10-10)
| Tema | Hallazgo | Fuente | Consecuencia |
| --- | --- | --- | --- |
| Supabase Free | 500 MB de base de datos; 1 GB de Storage; 5 GB de egress; 50 000 MAU; 500 000 invocaciones de Edge Functions; 2 proyectos activos; archivos de hasta 50 MB; "Free projects are paused after 1 week of inactivity" | https://supabase.com/pricing | Alcanza para la demo. Para un piloto, comprimir las fotos en el cliente y prever un plan de pago. |
| Vercel Hobby | 100 despliegues/día; 1 M de invocaciones; "restricts users to non-commercial, personal use only" | https://vercel.com/docs/plans/hobby | Válido para la hackatón. Un piloto comercial requiere el plan Pro u otro hosting. |
| Netlify Free (descartado) | 300 créditos; el despliegue de producción cuesta 15 (≈20 despliegues, cálculo propio) | https://www.netlify.com/pricing/ | Demasiado ajustado para 15 h. |
| Capacitor Android | `npm install @capacitor/android`, `npx cap add android`; "API 24+ (Android 7 or later) is supported"; requiere WebView con Chrome 60+; se gestiona con Android Studio | https://capacitorjs.com/docs/android | La página no explica cómo generar la APK firmada: consultar la guía de despliegue de Capacitor en el PRP 000. |
| Google OAuth vía Supabase (web) | Cliente OAuth tipo *Web application*; redirect al callback de Supabase; con scopes básicos se evita la verificación larga; sin dominio propio se muestra `<project-id>.supabase.co` | https://supabase.com/docs/guides/auth/social-login/auth-google | Solo scopes básicos. Registrar las cuentas de la demo si la app queda en modo de prueba. |
| OAuth en la app móvil (deep link) | Scheme propio, "Additional Redirect URLs" en Supabase, `intent-filter` VIEW/BROWSABLE y procesar la URL de regreso para fijar la sesión. Los ejemplos son de Expo y Kotlin; **no menciona Capacitor** | https://supabase.com/docs/guides/auth/native-mobile-deep-linking | El patrón es aplicable, pero la implementación con Capacitor (`@capacitor/app` y `@capacitor/browser`) **no está verificada**: probarla en la hora 2. |
| Voz nativa (Capacitor) | El plugin `@capacitor-community/speech-recognition` soporta Android y escucha el micrófono en vivo; el idioma se elige entre los que devuelve `getSupportedLanguages()`, que "is not available on Android 13 and newer" | https://github.com/capacitor-community/speech-recognition | No documenta el modo sin conexión ni la transcripción de archivos: se usa solo con conexión. Fijar `es-PE` o `es-ES` y probarlo en el dispositivo. |
| Audio vía OpenRouter | Lista wav, mp3, aiff, aac, ogg, flac, m4a, pcm16 y pcm24 (**no lista webm**); "varían según el proveedor" | https://openrouter.ai/docs/features/multimodal/audio | Ya no aplica: OpenRouter salió con CC-12. |
| Audio en Gemini | Acepta `audio/webm` y `audio/ogg`, entre otros | https://ai.google.dev/gemini-api/docs/audio | Gemini lo soporta. Desde CC-12 el audio va a Gemini por LiteLLM; queda por probar el bloque que traduce el proxy. |
| Dictado en el navegador (Web Speech API) | Por defecto usa un servidor y "won't work offline" | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API | Reemplazado por el plugin nativo en la APK. |
| Transcripción en el dispositivo (Transformers.js) | No documenta el modo sin conexión ni el tamaño de los modelos | https://huggingface.co/docs/transformers.js/index | Descartado para el MVP. |
