# Plan — Ayllu
Aprobado: <AAAA-MM-DD> (alcance revisado en `docs/revision-alcance.md`)

## Tecnología
- Lenguaje / framework: TypeScript, React y Vite, con un solo código (ver `decisiones/0001-stack.md` y `cambios/CC-01.md`)
- Comprador y administrador: web estática servida desde el servidor propio por Cloudflare Tunnel (`ayllu.likadev.com`; 0003 / CC-05)
- Artesano: APK de Android empaquetada con Capacitor (mínimo Android 7 / API 24), instalada directamente en el celular
- Sin conexión: IndexedDB (Dexie) dentro de la APK para los borradores
- Voz: plugin `@capacitor-community/speech-recognition` (dictado con conexión)
- Base de datos: Supabase **self-hosted** (Postgres con RLS, Auth con Google y contraseña, Storage, Edge Functions)
- IA: Gemini, llamado solo desde Edge Functions a través del proxy LiteLLM en el servidor del equipo (Cloudflare Tunnel), sin respaldo: OpenRouter salió con CC-12 (ver `decisiones/0002-proxy-ia-litellm.md`, `cambios/CC-02.md` y `cambios/CC-12.md`)
- Despliegue: servidor de Johann (Debian, Docker) con Supabase self-hosted v0.8.2, la web y LiteLLM, publicados por Cloudflare Tunnel; lo opera una laptop autorizada (PRP 009 y PRP 010)
- Verificación: ESLint, Prettier `--check`, `tsc --noEmit` y Vitest (se conectan a `make verify` en el PRP 000)

## Arquitectura
- **Web (navegador, celular o laptop):** vitrina, pedidos del comprador y panel del administrador.
- **APK del artesano (Capacitor):** borradores, publicación y gestión de sus órdenes. La interfaz viaja dentro de la APK y abre sin conexión. El artesano usa **solo la APK** (CC-08): crea su cuenta con correo y contraseña (CC-09) o con Google y una contraseña (CC-06), y vuelve a entrar con correo y contraseña; la sesión queda guardada y la app abre sin conexión.
- **Borrador local:** se guarda en IndexedDB y se sincroniza al servidor cuando hay conexión. Un borrador pertenece a un solo dispositivo.
- **Supabase:**
  - Auth (Google y correo con contraseña).
  - Postgres (perfiles, productos, fotos del producto, órdenes, mensajes de la orden), en 3FN como mínimo (CC-09).
  - Realtime para el hilo y el estado de la orden (CC-09).
  - Storage (fotos originales y de IA, audios).
- **Edge Function `procesar-producto`:** recibe la foto original y el texto dictado (o el audio, como respaldo). En una llamada al proxy LiteLLM evalúa si es artesanía y si el contenido es apropiado, genera la ficha con título y etiquetas, y comenta el precio. Propone hasta 4 fotos, también por el proxy (alias `ayllu-imagen`, CC-12). Guarda el resultado sin borrar la foto original (CC-09).
- **Pago:** fuera del sistema. El vendedor pega un enlace de pago (por ejemplo, un link individual de Izipay) y confirma el abono a mano.
- **Despacho:** fuera del sistema. La orden guarda los datos estructurados que se entregan a la agencia (por ejemplo, Shalom).

## Modelo de datos
Preliminar; el detalle va en `docs/contratos.md`.
- **Perfil:** rol (comprador / artesano / admin), nombre, WhatsApp, playa, asociación (texto), historia, número RNA declarado, estado de acreditación — relación 1:1 con el usuario de Auth.
- **Producto:** artesano, nombre, audio, transcripción, ficha (título, descripción, materiales, técnica, tipo, historia, etiquetas), costos (materiales, horas, pago por hora, gastos, ganancia en S/), precio final, disponibilidad (en stock | a pedido + plazo), revisión de la IA, estado — pertenece a un Perfil artesano.
- **FotoProducto:** producto, origen (original / IA), variante, ruta, publicada, posición — pertenece a un Producto (CC-09).
- **Orden:** producto, comprador, modalidad (recojo / envío), datos de envío, costo de envío, total, fecha estimada, enlace de pago, número de guía, estado — relaciona un Producto con un comprador; el vendedor sale del producto.
- **MensajeOrden:** orden, autor, texto original, texto traducido (opcional) — pertenece a una Orden.

## Casos de uso (en orden de construcción)
Dueño de todos los CU: Cristopher (implementación). Imprescindibles: CU-00 a CU-07, CU-09, CU-11 y CU-12 (CU-09 lo es desde CC-12: sin proxy no hay IA). Opcional: CU-08.

**Orden de implementación (CC-11, detalle en `docs/modulos.md`):**
- **Fase 0**, una persona: 000 → 011 → 012.
- **Después, tres módulos en paralelo** y sin archivos compartidos:
  - A: 001 → 002 → 003.
  - B: 004 → 007, y 009 → 010 (el 009 primero: el 003 lo necesita, CC-12).
  - C: 005 → 006 → 008, si hay tiempo y con el 003 ya en `main`.

El despliegue de los PRP 009 y 010 lo hace la laptop autorizada. Mientras tanto se desarrolla con `supabase start` en local (Docker).

| # | Caso de uso | Actor | Depende de | Hito |
| --- | --- | --- | --- | --- |
| CU-00 | Base: web desplegada con HTTPS y APK del artesano con Capacitor que se instala en un Android | equipo | — | H1 |
| CU-01 | Acceder (comprador con Google; artesano con correo o Google) y solicitar acreditación con RNA; el admin aprueba o rechaza | artesano, admin, comprador | CU-00 | H1 |
| CU-11 | Sistema visual (tokens, componentes, fuentes locales), antes de las pantallas | equipo | CU-00 | H1 |
| CU-12 | Esquema base y costuras para trabajar en paralelo (Fase 0) | equipo | CU-00, CU-11 | H1 |
| CU-02 | Crear un borrador de producto sin conexión (nombre, foto, audio, calculadora, disponibilidad) y sincronizarlo | artesano | CU-00, CU-01 | H1 |
| CU-03 | Procesar el borrador con IA (filtro de artesanía, ficha, etiquetas y 4 fotos), revisarlo, corregirlo y publicarlo | artesano | CU-02 | H2 |
| CU-04 | Explorar la vitrina pública: búsqueda, filtros y etiquetas, ficha con carrusel, perfil y WhatsApp | comprador | CU-00 (con datos semilla) | H1 |
| CU-05 | Pedir un producto con recojo o envío y escribir en el hilo de la orden | comprador, artesano | CU-01, CU-04 | H2 |
| CU-06 | Confirmar el pedido, enviar el enlace de pago, verificar el abono y marcar el envío con botón de rastreo | artesano, comprador | CU-05 | H3 |
| CU-07 | Datos semilla ficticios de la demo (`supabase/seed.sql`); el guion y el video son tareas de entrega (`docs/entrega/demo.md`, CC-09) | equipo | CU-04 a CU-06 | H3 |
| CU-09 | Proxy de IA con LiteLLM en el servidor (infraestructura de CU-03 y CU-08) | equipo | CU-00 | H1 |
| CU-10 | Supabase self-hosted y web en el servidor (infraestructura) | equipo | CU-00 | H1 |
| CU-08 | (Opcional) Traducir el hilo de la orden con "Ver original" | comprador, artesano | CU-05 | H3 |

## Hitos
- **H1 (≈ hora 5):** la APK se instala en un Android; el catálogo muestra datos semilla; el artesano entra con Google y guarda un borrador en modo avión.
- **H2 (≈ hora 10):** el borrador se procesa con IA y se publica; el comprador crea una orden.
- **H3 (≈ hora 13):** el flujo completo de orden y pago manual funciona; la demo de 3 minutos está ensayada y hay un video de respaldo (`docs/entrega/demo.md`). Las últimas 2 h, solo integración y ensayo.

## Riesgos
Detalle completo en `docs/revision-alcance.md` §5.
- La IA altera la foto del producto → la original nunca se borra, la ficha siempre enlaza a ella y las fotos de IA solo se publican si el artesano las elige.
- 4 fotos de IA por intento son lentas o caras → se generan en paralelo, cada falla es una advertencia y el límite es de 3 intentos por producto; medir el tiempo en la primera prueba (CC-09).
- El filtro de artesanía rechaza una pieza legítima → el artesano reintenta con otra foto o el administrador reinicia `revision_ia` por SQL (CC-09).
- Registro por correo sin confirmación (sin SMTP) → alguien podría usar el correo de otra persona; publicar exige la aprobación del administrador. Riesgo aceptado para la hackatón (CC-09).
- Falla la red o se agota la cuota en la demo → video de respaldo y llaves de Gemini de proyectos distintos en el proxy.
- Servidor propio caído (sin UPS ni internet de respaldo confirmados) → con 0003 cae **todo** el producto, no solo la IA: revisar el servidor antes de presentar y tener el video de respaldo.
- Servidor del proxy apagado o sin internet → sin respaldo (CC-12): la Edge Function responde `502 ia_no_disponible` tras `IA_TIMEOUT_MS` y el artesano completa la ficha a mano; probarlo apagando el contenedor.
- Llaves de Gemini directo en el proxy → **bloqueante (CC-12):** confirmar con los organizadores la restricción «Gemini con OpenRouter».
- Contraseña sobre una cuenta de Google (`updateUser({ password })`, CC-03) → probarlo en la hora 2; si exige reautenticación, aplicarla inmediatamente después del login con Google.
- La compilación de Android se traba (Android Studio/JDK, firma) → la APK se compila en la máquina de Cristopher, a cargo de Claude Code. Ahí hay Android Studio con su JDK 25, el SDK con la plataforma android-37 y build-tools 36. En la hora 1 se compila una APK de debug vacía y se instala en un celular. Si el Gradle que genera Capacitor no admite JDK 25, se instala el JDK que pida Capacitor.
- Descripción hablada → con conexión se dicta en vivo con el reconocimiento de voz nativo y a la IA va solo texto. Sin conexión se graba el audio; al volver la señal se dicta de nuevo o, si la prueba de formato de la hora 1 funciona, se envía el audio. Siempre se puede escribir a mano.
- Se pierde un borrador local → no borrarlo hasta que el servidor confirme la subida.
- Doble venta de una pieza única (no hay reserva, CC-09) → el artesano acepta una orden y rechaza las demás desde «Mis pedidos».
- Datos personales del padrón → no cargarlos en la app; datos semilla ficticios.
