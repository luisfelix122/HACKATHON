# Contratos compartidos

Fuente única de las interfaces entre partes del sistema. Cambiar algo aquí exige
PR propio, aviso al equipo y `docs/cambios/CC-XX.md` (ver `AGENTS.md`).

Responsable: <nombre> · Última revisión: 2026-10-10

Stack: `docs/decisiones/0001-stack.md`. Términos y reglas: `docs/dominio.md`.

Las tablas viven en Postgres (esquema `public`) con RLS activado.

**Normalización (CC-09):** todo el modelo cumple como mínimo la Tercera Forma Normal (3FN). No se guardan datos derivados ni dependencias transitivas. `jsonb` solo se usa para objetos de valor que se escriben y leen completos (`ficha`, `costeo`, `datos_envio`, `texto_traducido`); un dato con estado propio o que se relaciona con otra entidad va en su propia tabla.

## Entidades compartidas

### `perfil`
Lo crea el cliente con `insert` (una sola vez) en el primer inicio de sesión; las ediciones van por `update` (CC-04).

| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `id` | uuid | sí | = `auth.users.id` |
| `rol` | `comprador` \| `artesano` \| `admin` | sí | La APK crea `artesano` y la web, `comprador`. `admin` solo se asigna por SQL. |
| `nombre` | text | sí | Viene de Google y es editable |
| `whatsapp` | text | artesano: sí | Formato E.164, por ejemplo `+51999999999` |
| `lugar` | text | artesano: sí | Valor de la lista de lugares (ver Convenciones) |
| `asociacion` | text | no | Texto libre |
| `historia` | text | no | Valor cultural, máximo 600 caracteres |
| `rna_numero` | text | artesano: sí, para solicitar acreditación | Lo declara el artesano |
| `acreditacion` | `pendiente` \| `aprobada` \| `rechazada` | artesano: sí | Valor por defecto: `pendiente` |
| `acreditacion_nota` | text | no | Motivo del rechazo |
| `creado_en` | timestamptz | sí | |

### `producto`
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `id` | uuid | sí | Lo genera el **cliente** al crear el borrador local, así la subida es idempotente |
| `artesano_id` | uuid → `perfil.id` | sí | |
| `estado` | `borrador` \| `procesando` \| `en_revision` \| `publicado` \| `retirado` | sí | |
| `nombre` | text | sí | Nombre que le da el artesano |
| `descripcion_texto` | text | no* | Texto dictado o escrito, máximo 2000 caracteres. *Al procesar se exige este campo o `audio_ruta` |
| `audio_ruta` | text | no | Ruta en el bucket `audios` (respaldo de la grabación sin conexión) |
| `ficha` | jsonb | publicar: sí | `{ titulo, descripcion, materiales: text[], tecnica, tipo_producto, historia_pieza, etiquetas: text[] }`. Ver «Ficha» |
| `costeo` | jsonb | no | `{ materiales, horas, pago_hora, gastos, ganancia }`, todo en PEN. El precio sugerido se calcula, no se guarda (CC-09) |
| `precio_final` | numeric(10,2) | publicar: sí | > 0 |
| `disponibilidad` | `en_stock` \| `a_pedido` | publicar: sí | `en_stock`: pieza lista, sin cantidad (CC-09) |
| `plazo_dias` | int | si `a_pedido` | > 0 |
| `revision_ia` | `sin_revisar` \| `aprobada` \| `rechazada` | sí | Valor por defecto: `sin_revisar`. Con `rechazada` no se puede publicar (CC-09) |
| `comentario_precio_ia` | text | no | Referencia de la IA sobre el precio; no obliga a nada |
| `ia_error` | text | no | Último error o motivo de rechazo del procesamiento |
| `ia_intentos` | int | sí | Valor por defecto: 0. Lo incrementa la Edge Function y lo usa para aplicar `limite_ia` |
| `creado_en` / `actualizado_en` | timestamptz | sí | |

#### Ficha
| Campo | Regla |
| --- | --- |
| `titulo` | Nombre comercial para turistas, entre 1 y 80 caracteres |
| `descripcion` | No vacía, máximo 1200 caracteres |
| `materiales` | Arreglo de texto, al menos 1 |
| `tecnica` | Texto, máximo 120 caracteres |
| `tipo_producto` | Valor de la lista de `docs/dominio.md` |
| `historia_pieza` | Texto, máximo 600 caracteres |
| `etiquetas` | Entre 0 y 8, en minúsculas, cada una de 2 a 30 caracteres, sin repetir |

### `foto_producto` (CC-09)
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `id` | uuid | sí | La original la genera el cliente, junto con el borrador |
| `producto_id` | uuid → `producto.id` | sí | Borrado en cascada |
| `origen` | `original` \| `ia` | sí | Exactamente una `original` por producto (índice único parcial) |
| `variante` | `estudio` \| `luz` \| `vitrina` \| `contexto` | si `ia` | Nula en la original |
| `ruta` | text | sí | Ruta en el bucket `fotos` |
| `publicada` | boolean | sí | La original nace en `true` y las de IA en `false`. Publicar exige al menos una |
| `posicion` | int | sí | Orden en el carrusel, empezando en 0 |
| `creado_en` | timestamptz | sí | |

La foto original nunca se borra ni se sobrescribe. Si el artesano no la publica, la ficha pública igual enlaza a ella («Ver foto original»).

### `orden`
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `id` | uuid | sí | |
| `producto_id` | uuid → `producto.id` | sí | |
| `comprador_id` | uuid → `perfil.id` | sí | El artesano no se guarda: se obtiene de `producto.artesano_id` (3FN, CC-09) |
| `cantidad` | int | sí | ≥ 1. No reserva stock (CC-09) |
| `modalidad` | `recojo` \| `envio` | sí | |
| `datos_envio` | jsonb | si `envio` | Ver «Datos de envío» |
| `detalle` | text | no | Personalización pedida |
| `costo_envio` | numeric(10,2) | al aceptar, si `envio` | ≥ 0 |
| `total` | numeric(10,2) | al aceptar | Precio × cantidad + envío |
| `fecha_entrega_estimada` | date | al aceptar | La interfaz la prellena (ver «Estimación de entrega»); el artesano la puede corregir |
| `enlace_pago` | text | en `pago_pendiente` | URL `https` |
| `numero_guia` | text | en `enviada` | Se muestra con enlace de rastreo (ver «Seguimiento del envío») |
| `estado` | ver `docs/dominio.md` | sí | |
| `creado_en` / `actualizado_en` | timestamptz | sí | |

#### Datos de envío
`{ nombre_destinatario, telefono, departamento, provincia, distrito, agencia_destino, referencia? }`

Los requisitos de identificación de Shalom (por ejemplo, el DNI del destinatario) **no están verificados**. No se piden hasta confirmarlos.

#### Seguimiento del envío (CC-09)
El `numero_guia` se muestra como enlace a `https://rastreo.shalom.pe/` y con un botón «Copiar número». **Sin verificar** si la página acepta el número en la URL; si no lo acepta, el enlace abre la página y el comprador pega el número.

#### Estimación de entrega (CC-09)
Al aceptar, la interfaz propone `fecha_entrega_estimada = hoy + plazo_dias (si a_pedido) + días de envío`. Días de envío desde Piura por departamento de destino **(supuesto)**: Piura 1, Tumbes y Lambayeque 2, Lima y La Libertad 3, resto 5. Con `recojo` no se suman días de envío.

### `mensaje_orden`
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `id` | uuid | sí | |
| `orden_id` | uuid → `orden.id` | sí | |
| `autor_id` | uuid → `perfil.id` | sí | Debe ser el comprador o el artesano de la orden |
| `texto_original` | text | sí | Entre 1 y 1000 caracteres |
| `texto_traducido` | jsonb | no | `{ "<idioma>": "<texto>" }` (CU-08, opcional) |
| `creado_en` | timestamptz | sí | |

## Archivos (Supabase Storage)
| Bucket | Ruta | Lectura | Escritura |
| --- | --- | --- | --- |
| `fotos` | `{artesano_id}/{producto_id}/original.jpg` y `.../ia-{variante}.png` | Pública | Solo el artesano dueño, o la Edge Function |
| `audios` | `{artesano_id}/{producto_id}/descripcion.{ext}` | Solo el artesano dueño | Solo el artesano dueño |

La foto se comprime en el cliente antes de subirla: lado mayor de 1600 px y calidad JPEG de 0,8 **(supuesto)**.

## Acceso (CC-03)
- **Comprador (web):** `signInWithOAuth({ provider: "google" })`. En el primer ingreso se crea `perfil` con `rol = comprador`.
- **Artesano, registro (solo APK, CC-08).** La web no tiene registro de artesanos. Dos caminos, y ambos terminan con `insert` del `perfil` con `rol = artesano` y `acreditacion = pendiente` (sin `acreditacion_nota`):
  - **Con correo y contraseña (CC-09):** `signUp({ email, password })` (mínimo 8 caracteres). Supabase autoconfirma el correo (`ENABLE_EMAIL_AUTOCONFIRM=true`, sin SMTP), así que la sesión queda iniciada al instante.
  - **Con Google (CC-06):** deep link (`redirectTo: pe.ayllu.artesano://auth`, navegador del sistema) → `updateUser({ password })` → perfil.
- **Artesano, cambio de contraseña (APK, «Tu cuenta»):** `updateUser({ password })` con la sesión iniciada. Si la olvidó: entra con Google si su correo es de Google; si no, el administrador la restablece desde Supabase Studio (paso manual, CC-09).
- **Artesano, ingreso (APK):** `signInWithPassword({ email, password })`. Si el perfil no es `artesano`, la APK cierra la sesión.
- **Sesión:** persistente (`persistSession: true`) e indefinida, con la clave fija `ayllu.auth`. Tras el primer ingreso, la APK abre sin conexión (modo avión) con la sesión guardada.
- **Errores visibles:** `credenciales_invalidas` → «Correo o contraseña incorrectos»; `rol_incorrecto` → «Esta app es para artesanos».

## Permisos (RLS)

### Matriz de roles (CC-09)
| Rol | Dónde | Puede | No puede |
| --- | --- | --- | --- |
| Visitante (sin cuenta) | Web | Explorar la vitrina con filtros por lugar, tipo, asociación y etiqueta; ver la ficha, el perfil del artesano y el botón de WhatsApp | Pedir ni escribir en un hilo |
| Comprador (Google) | Web | Lo del visitante, más crear órdenes (recojo o envío), confirmar el total, ver sus órdenes y escribir en su hilo | Cambiar estados fuera de sus RPC, marcar una orden como pagada, ver órdenes ajenas |
| Artesano (correo y contraseña o Google) | APK | Crear borradores sin conexión, procesar con IA, revisar y publicar (si está `aprobada`); aceptar o rechazar órdenes, enviar el enlace de pago, verificar el abono y marcar envío, recojo o entrega | Publicar sin acreditación o con `revision_ia = rechazada`; cambiar su rol o su acreditación |
| Administrador | Web, `/admin` | Revisar el RNA declarado y aprobar o rechazar acreditaciones | Editar perfiles o productos ajenos fuera de `resolver_acreditacion` |

### Reglas por rol
- **Visitante (`anon`):** solo lee productos `publicado`, sus fotos con `publicada = true` (y la original, para el enlace «Ver foto original») y los campos públicos de los perfiles de artesanos `aprobada` (nombre, lugar, asociación, historia, WhatsApp).
- **Comprador:** lo anterior, más sus órdenes y los mensajes de esas órdenes.
- **Artesano:**
  - Productos y sus fotos: lee y escribe los suyos. No puede pasar un producto a `publicado` si su acreditación no está `aprobada`, si `revision_ia = rechazada` o si no tiene al menos una foto publicada; esto lo controla el trigger `exigir_acreditacion_para_publicar`.
  - No escribe `revision_ia`, `comentario_precio_ia`, `ia_error` ni `ia_intentos`: solo la Edge Function (o el admin por SQL).
  - Órdenes: lee las de sus productos (unión con `producto.artesano_id`), pero no las actualiza directamente; los cambios de estado pasan por RPC.
- **Nadie** actualiza `orden` directamente desde el cliente: no hay política de `update`. Total, modalidad, destino y estado solo cambian por RPC.
- **Admin:** lee todos los perfiles. Solo cambia `acreditacion` y `acreditacion_nota` mediante la RPC `resolver_acreditacion(artesano uuid, resultado acreditacion, nota text)`, que lanza `no_autorizado` si quien llama no es admin y `datos_incompletos` si un rechazo no tiene motivo (CC-04).

## Interfaces (API / eventos / módulos)

### Procesar producto con IA
- **Tipo:** Supabase Edge Function (HTTP POST con el JWT del artesano).
- **Ruta:** `/functions/v1/procesar-producto`.
- **Entrada:** `{ producto_id: uuid, mejorar_foto: boolean }`. El producto debe pertenecer al usuario y tener `descripcion_texto` o `audio_ruta`.
- **Efecto:**
  1. Pasa el producto a `procesando` e incrementa `ia_intentos`.
  2. En **una sola llamada** al cliente de IA (ver «Proxy de IA»), con la foto original y el texto (o el audio si no hay texto), obtiene la evaluación, la `ficha` y el `comentario_precio` (CC-09). El costeo y el precio final van como contexto.
  3. Si la evaluación rechaza la pieza, guarda `revision_ia = rechazada` y el motivo en `ia_error`, devuelve el producto a `borrador` y responde `422`.
  4. Si la acepta, guarda `revision_ia = aprobada`, la `ficha` y `comentario_precio_ia`.
  5. Si `mejorar_foto` es verdadero, genera en paralelo las 4 variantes (`estudio`, `luz`, `vitrina`, `contexto`), las guarda como `ia-{variante}.png` en `fotos` y crea sus filas en `foto_producto` con `publicada = false`. Reemplaza las variantes de un intento anterior; la original no se toca.
  6. Deja el producto en `en_revision`.
  7. Si falla, lo devuelve a `borrador` con `ia_error`.
- **Salida (200):** `{ estado, ficha, evaluacion, comentario_precio, fotos_ia: [{ id, variante, ruta }], advertencias: string[] }`. Si fallan algunas variantes de la foto, la ficha y las demás fotos se entregan igual y se agrega una advertencia por cada una.
- **Evaluación:** `{ es_artesania: boolean, contenido_apropiado: boolean, motivo: string }`. `motivo` tiene como máximo 200 caracteres y se muestra al artesano.
- **Seguridad del prompt (CC-09):** el texto del artesano va delimitado (`<descripcion_del_artesano>…</descripcion_del_artesano>`) y el prompt de sistema indica que es un dato y no una instrucción. La salida se pide en JSON y se valida contra el esquema de «Ficha»; cualquier campo extra se descarta. La interfaz muestra los textos de la IA como texto plano, nunca como HTML.
- **Errores:**
  - `400 entrada_invalida`
  - `401 no_autenticado`
  - `403 no_es_dueno`
  - `409 estado_invalido`: el producto no está en `borrador` ni en `en_revision`.
  - `422 no_es_artesania`: la pieza parece industrial o no es una artesanía local. El producto queda en `borrador` con `revision_ia = rechazada`.
  - `422 contenido_no_permitido`: la foto o el texto tienen contenido ofensivo o inapropiado. Mismo efecto.
  - `502 ia_no_disponible`: el producto queda en `borrador`; `revision_ia` no cambia.
  - `429 limite_ia`: se superó el límite de llamadas a la IA por producto **(supuesto: 3 por producto)**.
- **Secretos:** `OPENROUTER_API_KEY`, `IA_BASE_URL`, `IA_API_KEY` e `IA_TIMEOUT_MS`, solo en el entorno de la función.
- **Usado por:** CU-03.

### Transiciones de orden
- **Tipo:** funciones Postgres llamadas por RPC (`supabase.rpc`). Validan el actor, el estado actual y las reglas 8–10 de `docs/dominio.md` dentro de una transacción. El artesano de la orden se obtiene siempre de `producto.artesano_id`.

| Función | Actor | Desde → hacia | Entrada adicional |
| --- | --- | --- | --- |
| `crear_orden` | comprador | — → `solicitada` | `producto_id, cantidad, modalidad, datos_envio?, detalle?` |
| `aceptar_orden` | artesano | `solicitada` → `aceptada` (sin reserva de stock, CC-09) | `costo_envio?, total, fecha_entrega_estimada` |
| `rechazar_orden` | artesano | `solicitada` → `rechazada` | `motivo?` |
| `confirmar_total` | comprador | `aceptada` → `confirmada` | — |
| `enviar_enlace_pago` | artesano | `confirmada` → `pago_pendiente` | `enlace_pago` |
| `verificar_abono` | artesano | `pago_pendiente` → `pagada` | — |
| `marcar_enviada` | artesano | `pagada` → `enviada` | `numero_guia` |
| `marcar_lista_recojo` | artesano | `pagada` → `lista_para_recojo` | — |
| `marcar_entregada` | artesano | `enviada` / `lista_para_recojo` → `entregada` | — |
| `cancelar_orden` | cualquiera de las partes | `aceptada` / `confirmada` / `pago_pendiente` → `cancelada` | `motivo?` |

- **Concurrencia:** cada RPC cambia el estado con `update … where id = $1 and estado = <origen>`; si no actualiza ninguna fila, lanza `transicion_invalida`. Así dos llamadas simultáneas no aplican la misma transición dos veces.
- **Errores:** excepción de Postgres con código en el mensaje: `transicion_invalida`, `no_autorizado`, `datos_incompletos`.
- **Realtime (CC-09):** `orden` y `mensaje_orden` están en la publicación `supabase_realtime`. El cliente se suscribe a los cambios de la orden abierta; RLS filtra qué recibe cada parte. Si la suscripción falla, la interfaz ofrece «Actualizar».
- **Usado por:** CU-05, CU-06.

### Traducir mensaje (opcional, CU-08)
- **Tipo:** Supabase Edge Function (HTTP POST con el JWT de una de las partes de la orden).
- **Ruta:** `/functions/v1/traducir-mensaje`.
- **Entrada:** `{ mensaje_id: uuid, idioma: string }`. `idioma` es un código BCP 47 tomado de `navigator.language`.
- **Efecto:** si `texto_traducido[idioma]` ya existe, lo devuelve sin volver a llamar a la IA. Si no, traduce con el cliente de IA y lo guarda.
- **Salida (200):** `{ texto: string, idioma: string }`.
- **Errores:**
  - `403 no_es_parte`
  - `502 ia_no_disponible`: el cliente muestra el original.
- **Usado por:** CU-08.

### Proxy de IA (LiteLLM)
- **Tipo:** HTTP, compatible con OpenAI. Solo lo llaman las Edge Functions, nunca el cliente.
- **Ruta:** `${IA_BASE_URL}/v1/chat/completions`, con la cabecera `Authorization: Bearer ${IA_API_KEY}`.
- **Alias de modelo** (definidos en `infra/litellm/config.yaml`):
  - `ayllu-texto`: evaluación, ficha y comentario de precio (texto más la foto original como `image_url` con data URI base64, CC-09) y traducción.
  - `ayllu-audio`: audio como bloque `file` con data URI base64, más la foto original igual que `ayllu-texto`.
- **Respaldo:** si el proxy excede `IA_TIMEOUT_MS` (por defecto 8000), devuelve 5xx o `IA_BASE_URL` no está definida, la misma petición va a OpenRouter (`https://openrouter.ai/api/v1/chat/completions`, `OPENROUTER_API_KEY`) con el modelo equivalente.
- **Imagen:** las 4 variantes de la foto van siempre directo a OpenRouter (`POST /api/v1/images`, `google/gemini-2.5-flash-image`, con la original en `input_references`), una petición por variante y en paralelo.
- **Usado por:** CU-03, CU-08.
- **Responsable:** Cristopher.

### Sincronización del borrador local (APK → Supabase)
- **Tipo:** módulo del cliente.
- **Pasos:**
  1. Sube la foto, y el audio si existe, a Storage con `upsert`.
  2. Hace `upsert` del `producto` con el mismo `id` local y estado `borrador`.
  3. Hace `upsert` de la fila `original` de `foto_producto`, con el `id` generado en el celular.
  4. Marca el borrador local como sincronizado.
  5. Solo entonces lo borra del celular.
- **Errores:** si falla un paso, el borrador queda `pendiente` y se reintenta al recuperar la conexión o con el botón "Sincronizar".
- **Usado por:** CU-02.

## Estados de interfaz (comunes a la web y la APK)
- **Cargando:** indicador y texto corto («Cargando…»). Nunca una pantalla en blanco.
- **Vacío:** mensaje con la siguiente acción, por ejemplo «Aún no tienes productos. Toca Nuevo».
- **Error:** el `mensaje` legible del contrato y un botón «Reintentar». Nunca códigos técnicos.
- **Sin conexión (APK):** franja visible «Sin señal: lo guardamos en tu celular». Se ocultan las acciones que requieren red: dictar, Preparar con IA, Publicar.
- **Acción en curso:** el botón queda deshabilitado mientras se espera la respuesta, para evitar doble envío.

## Ejemplo: procesar producto
```json
// POST /functions/v1/procesar-producto
{ "producto_id": "8c1f…", "mejorar_foto": true }
// 200
{ "estado": "en_revision",
  "ficha": { "titulo": "Poncho-toalla de algodón para surfistas", "descripcion": "Poncho-toalla de algodón…",
             "materiales": ["algodón"], "tecnica": "costura", "tipo_producto": "textil",
             "historia_pieza": "…", "etiquetas": ["surf", "algodón", "lobitos"] },
  "evaluacion": { "es_artesania": true, "contenido_apropiado": true, "motivo": "Costura a mano visible" },
  "comentario_precio": "El precio cubre tus costos y deja S/ 12 de ganancia.",
  "fotos_ia": [{ "id": "5d2e…", "variante": "estudio", "ruta": "a1b2…/8c1f…/ia-estudio.png" }],
  "advertencias": ["No se pudo generar la foto «contexto»."] }
// 422
{ "error": "no_es_artesania", "mensaje": "Esta pieza parece industrial. Si la hiciste tú, toma otra foto que muestre el trabajo a mano." }
// 502
{ "error": "ia_no_disponible", "mensaje": "No pudimos preparar tu producto. Puedes reintentar o completarlo a mano." }
```

## Convenciones
- **Fechas:** `timestamptz` en UTC; formato ISO 8601 en JSON. Se muestran en la zona `America/Lima`.
- **Identificadores:** uuid v4. Los del producto y de su foto original los genera el cliente.
- **Datos de prueba:** solo en `supabase/seed.sql`. Nunca en el código de la app (CC-09).
- **Montos:** `numeric(10,2)` en PEN; en JSON se envían como número.
- **Nombres:** `snake_case` en la base de datos y en JSON, tomados de `docs/dominio.md`. Sin sinónimos.
- **Lugares (filtro, preliminar):** Máncora, Lobitos, Cabo Blanco, El Ñuro, Los Órganos, El Alto, Pariñas, Colán, Punta Sal. **Pendiente** confirmar con La Vaca Loca la lista definitiva y si Punta Sal tiene artesanos.
- **Errores de la Edge Function:** `{ error: "<codigo>", mensaje: "<texto para mostrar>" }`.
- **Variables de entorno** (solo nombres, en `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente; es la "publishable key" que nombra la guía actual de Supabase) y `OPENROUTER_API_KEY`, `IA_BASE_URL`, `IA_API_KEY`, `IA_TIMEOUT_MS` (solo en las Edge Functions). En el servidor del proxy (`infra/litellm/.env.example`): `LITELLM_MASTER_KEY` e `IA_KEY_1…n`.
