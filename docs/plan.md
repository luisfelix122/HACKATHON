# Plan — Ayllu
Aprobado: <AAAA-MM-DD> (alcance revisado en `docs/revision-alcance.md`)

## Tecnología
- Lenguaje / framework: TypeScript, React y Vite, con un solo código (ver `decisiones/0001-stack.md` y `cambios/CC-01.md`)
- Comprador y administrador: web estática servida desde el servidor propio por Cloudflare Tunnel (`ayllu.likadev.com`; 0003 / CC-05)
- Artesano: APK de Android empaquetada con Capacitor (mínimo Android 7 / API 24), instalada directamente en el celular
- Sin conexión: IndexedDB (Dexie) dentro de la APK para los borradores
- Voz: plugin `@capacitor-community/speech-recognition` (dictado con conexión)
- Base de datos: Supabase **self-hosted** (Postgres con RLS, Auth con Google y contraseña, Storage, Edge Functions)
- IA: Gemini, llamado solo desde Edge Functions a través del proxy LiteLLM en el servidor del equipo (Cloudflare Tunnel), con OpenRouter directo como respaldo (ver `decisiones/0002-proxy-ia-litellm.md` y `cambios/CC-02.md`)
- Despliegue: servidor de Johann (Debian, Docker) con Supabase self-hosted v0.8.2, la web y LiteLLM, publicados por Cloudflare Tunnel; lo opera una laptop autorizada (PRP 009 y PRP 010)
- Verificación: ESLint, Prettier `--check`, `tsc --noEmit` y Vitest (se conectan a `make verify` en el PRP 000)

## Arquitectura
- **Web (navegador, celular o laptop):** vitrina, pedidos del comprador y panel del administrador.
- **APK del artesano (Capacitor):** borradores, publicación y gestión de sus órdenes. La interfaz viaja dentro de la APK y abre sin conexión. El artesano usa **solo la APK** (CC-08): crea su cuenta con Google dentro de la app, define una contraseña y vuelve a entrar con correo y contraseña; la sesión queda guardada y la app abre sin conexión (CC-06).
- **Borrador local:** se guarda en IndexedDB y se sincroniza al servidor cuando hay conexión. Un borrador pertenece a un solo dispositivo.
- **Supabase:**
  - Auth (Google).
  - Postgres (perfiles, productos, órdenes, mensajes de la orden).
  - Storage (fotos originales y mejoradas, audios).
- **Edge Function `procesar-producto`:** recibe el texto dictado (o el audio, como respaldo), genera la ficha con el proxy LiteLLM (o, si el proxy falla, con OpenRouter directo) y propone la foto mejorada mediante OpenRouter. Guarda el resultado sin borrar la foto original.
- **Pago:** fuera del sistema. El vendedor pega un enlace de pago (por ejemplo, un link individual de Izipay) y confirma el abono a mano.
- **Despacho:** fuera del sistema. La orden guarda los datos estructurados que se entregan a la agencia (por ejemplo, Shalom).

## Modelo de datos
Preliminar; el detalle va en `docs/contratos.md`.
- **Perfil:** rol (comprador / artesano / admin), nombre, WhatsApp, playa, asociación (texto), historia, número RNA declarado, estado de acreditación — relación 1:1 con el usuario de Auth.
- **Producto:** artesano, nombre, foto original, foto mejorada, foto elegida, audio, transcripción, ficha (descripción, materiales, técnica, tipo), costos (materiales, horas, pago por hora, gastos, ganancia en S/), precio final, disponibilidad (stock + cantidad | a pedido + plazo), estado — pertenece a un Perfil artesano.
- **Orden:** producto, comprador, vendedor, modalidad (recojo / envío), datos de envío, costo de envío, total, enlace de pago, vencimiento de la reserva, número de guía, estado — relaciona un Producto con un comprador.
- **MensajeOrden:** orden, autor, texto original, texto traducido (opcional) — pertenece a una Orden.

## Casos de uso (en orden de construcción)
Dueño de todos los CU: Cristopher (implementación). Imprescindibles: CU-00 a CU-07. Opcionales: CU-08 y CU-09 (el producto funciona con OpenRouter directo si el proxy no está listo).

| # | Caso de uso | Actor | Depende de | Hito |
| --- | --- | --- | --- | --- |
| CU-00 | Base: web desplegada con HTTPS y APK del artesano con Capacitor que se instala en un Android | equipo | — | H1 |
| CU-01 | Acceder con Google y solicitar acreditación con RNA; el admin aprueba o rechaza | artesano, admin, comprador | CU-00 | H1 |
| CU-02 | Crear un borrador de producto sin conexión (nombre, foto, audio, calculadora, disponibilidad) y sincronizarlo | artesano | CU-00, CU-01 | H1 |
| CU-03 | Procesar el borrador con IA, revisarlo, corregirlo y publicarlo | artesano | CU-02 | H2 |
| CU-04 | Explorar la vitrina pública: búsqueda, filtros, ficha, perfil y WhatsApp | comprador | CU-00 (con datos semilla) | H1 |
| CU-05 | Pedir un producto con recojo o envío y escribir en el hilo de la orden | comprador, artesano | CU-01, CU-04 | H2 |
| CU-06 | Confirmar el pedido, reservar stock, enviar el enlace de pago, verificar el abono y marcar el envío | artesano, comprador | CU-05 | H3 |
| CU-07 | Datos semilla ficticios y guion de demo | equipo | CU-04 a CU-06 | H3 |
| CU-09 | Proxy de IA con LiteLLM en el servidor (infraestructura de CU-03 y CU-08) | equipo | CU-00 | H1 |
| CU-10 | Supabase self-hosted y web en el servidor (infraestructura) | equipo | CU-00 | H1 |
| CU-08 | (Opcional) Traducir el hilo de la orden con "Ver original" | comprador, artesano | CU-05 | H3 |

## Hitos
- **H1 (≈ hora 5):** la APK se instala en un Android; el catálogo muestra datos semilla; el artesano entra con Google y guarda un borrador en modo avión.
- **H2 (≈ hora 10):** el borrador se procesa con IA y se publica; el comprador crea una orden.
- **H3 (≈ hora 13):** el flujo completo de orden y pago manual funciona; la demo está ensayada y hay un video de respaldo. Las últimas 2 h, solo integración y ensayo.

## Riesgos
Detalle completo en `docs/revision-alcance.md` §5.
- La IA altera la foto del producto → la original queda por defecto y la mejorada solo se usa si el artesano la acepta.
- Falla la red o se agota la cuota en la demo → video de respaldo y clave de OpenRouter con saldo.
- Servidor propio caído (sin UPS ni internet de respaldo confirmados) → con 0003 cae **todo** el producto, no solo la IA: revisar el servidor antes de presentar y tener el video de respaldo.
- Servidor del proxy apagado o sin internet → la Edge Function cae a OpenRouter directo tras `IA_TIMEOUT_MS`; probarlo apagando el contenedor.
- Llaves de Gemini directo en el proxy → confirmar con los organizadores la restricción «Gemini con OpenRouter».
- Contraseña sobre una cuenta de Google (`updateUser({ password })`, CC-03) → probarlo en la hora 2; si exige reautenticación, aplicarla inmediatamente después del login con Google.
- La compilación de Android se traba (Android Studio/JDK, firma) → la APK se compila en la máquina de Cristopher, a cargo de Claude Code. Ahí hay Android Studio con su JDK 25, el SDK con la plataforma android-37 y build-tools 36. En la hora 1 se compila una APK de debug vacía y se instala en un celular. Si el Gradle que genera Capacitor no admite JDK 25, se instala el JDK que pida Capacitor.
- Descripción hablada → con conexión se dicta en vivo con el reconocimiento de voz nativo y a OpenRouter va solo texto. Sin conexión se graba el audio; al volver la señal se dicta de nuevo o, si la prueba de formato de la hora 1 funciona, se envía el audio. Siempre se puede escribir a mano.
- Se pierde un borrador local → no borrarlo hasta que el servidor confirme la subida.
- Doble venta o reserva vencida → la reserva se crea al aceptar y vence a las 24 h tras enviar el enlace; el vencimiento se calcula al leer la orden.
- Datos personales del padrón → no cargarlos en la app; datos semilla ficticios.
