# Contratos compartidos

Fuente única de las interfaces entre partes del sistema. Cambiar algo aquí exige
PR propio, aviso al equipo y `docs/cambios/CC-XX.md` (ver `AGENTS.md`).

Responsable: <nombre> · Última revisión: 2026-10-10

Stack: `docs/decisiones/0001-stack.md`. Términos y reglas: `docs/dominio.md`.

Las tablas viven en Postgres (esquema `public`) con RLS activado.

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
| `nombre` | text | sí | |
| `foto_original_ruta` | text | sí | Ruta en el bucket `fotos` |
| `foto_mejorada_ruta` | text | no | Ruta en el bucket `fotos` |
| `usar_foto_mejorada` | boolean | sí | Valor por defecto: `false` |
| `descripcion_texto` | text | no* | Texto dictado o escrito. *Al procesar se exige este campo o `audio_ruta` |
| `audio_ruta` | text | no | Ruta en el bucket `audios` (respaldo de la grabación sin conexión) |
| `ficha` | jsonb | publicar: sí | `{ descripcion, materiales: text[], tecnica, tipo_producto, historia_pieza }` |
| `costeo` | jsonb | no | `{ materiales, horas, pago_hora, gastos, ganancia }`, todo en PEN |
| `precio_sugerido` | numeric(10,2) | no | Se calcula a partir de `costeo` |
| `precio_final` | numeric(10,2) | publicar: sí | > 0 |
| `disponibilidad` | `en_stock` \| `a_pedido` | publicar: sí | |
| `cantidad_disponible` | int | si `en_stock` | ≥ 0. Ya descuenta las reservas |
| `plazo_dias` | int | si `a_pedido` | > 0 |
| `ia_error` | text | no | Último error del procesamiento |
| `ia_intentos` | int | sí | Valor por defecto: 0. Lo incrementa la Edge Function y lo usa para aplicar `limite_ia` |
| `creado_en` / `actualizado_en` | timestamptz | sí | |

### `orden`
| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `id` | uuid | sí | |
| `producto_id` | uuid → `producto.id` | sí | |
| `comprador_id` | uuid → `perfil.id` | sí | |
| `artesano_id` | uuid → `perfil.id` | sí | Se copia del producto |
| `cantidad` | int | sí | ≥ 1 |
| `modalidad` | `recojo` \| `envio` | sí | |
| `datos_envio` | jsonb | si `envio` | Ver «Datos de envío» |
| `detalle` | text | no | Personalización pedida |
| `costo_envio` | numeric(10,2) | al aceptar, si `envio` | ≥ 0 |
| `total` | numeric(10,2) | al aceptar | Precio × cantidad + envío |
| `fecha_entrega_estimada` | date | al aceptar | |
| `enlace_pago` | text | en `pago_pendiente` | URL `https` |
| `reserva_vence_en` | timestamptz | en `pago_pendiente` | Momento de envío del enlace + 24 h |
| `numero_guia` | text | en `enviada` | |
| `estado` | ver `docs/dominio.md` | sí | |
| `creado_en` / `actualizado_en` | timestamptz | sí | |

#### Datos de envío
`{ nombre_destinatario, telefono, departamento, provincia, distrito, agencia_destino, referencia? }`

Los requisitos de identificación de Shalom (por ejemplo, el DNI del destinatario) **no están verificados**. No se piden hasta confirmarlos.

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
| `fotos` | `{artesano_id}/{producto_id}/original.jpg` y `.../mejorada.png` | Pública | Solo el artesano dueño, o la Edge Function |
| `audios` | `{artesano_id}/{producto_id}/descripcion.{ext}` | Solo el artesano dueño | Solo el artesano dueño |

La foto se comprime en el cliente antes de subirla: lado mayor de 1600 px y calidad JPEG de 0,8 **(supuesto)**.

## Acceso (CC-03)
- **Comprador (web):** `signInWithOAuth({ provider: "google" })`. En el primer ingreso se crea `perfil` con `rol = comprador`.
- **Artesano, registro (web `/artesano/registro`):** Google → `updateUser({ password })` (mínimo 8 caracteres) → `insert` del `perfil` con `rol = artesano` y `acreditacion = pendiente` (sin `acreditacion_nota`).
- **Artesano, registro en la APK (CC-06):** Google por deep link (`redirectTo: pe.costearte.artesano://auth`, navegador del sistema) → contraseña → perfil, igual que en la web. La ruta web queda como respaldo.
- **Artesano, ingreso (APK):** `signInWithPassword({ email, password })`. El usuario es el **correo de Google**. Si el perfil no es `artesano`, la APK cierra la sesión.
- **Sesión:** persistente (`persistSession: true`). Tras el primer ingreso, la APK abre sin conexión con la sesión guardada.
- **Errores visibles:** `credenciales_invalidas` → «Correo o contraseña incorrectos»; `rol_incorrecto` → «Esta app es para artesanos».

## Permisos (RLS)
- **Visitante (`anon`):** solo lee productos `publicado` y los campos públicos de los perfiles de artesanos `aprobada` (nombre, lugar, asociación, historia, WhatsApp).
- **Comprador:** lo anterior, más sus órdenes y los mensajes de esas órdenes.
- **Artesano:**
  - Productos: lee y escribe los suyos. No puede pasar un producto a `publicado` si su acreditación no está `aprobada`; esto lo controla un trigger o una regla.
  - Órdenes: lee las suyas, pero no las actualiza directamente; los cambios de estado pasan por RPC.
- **Admin:** lee todos los perfiles. Solo cambia `acreditacion` y `acreditacion_nota` mediante la RPC `resolver_acreditacion(artesano uuid, resultado acreditacion, nota text)`, que lanza `no_autorizado` si quien llama no es admin y `datos_incompletos` si un rechazo no tiene motivo (CC-04).

## Interfaces (API / eventos / módulos)

### Procesar producto con IA
- **Tipo:** Supabase Edge Function (HTTP POST con el JWT del artesano).
- **Ruta:** `/functions/v1/procesar-producto`.
- **Entrada:** `{ producto_id: uuid, mejorar_foto: boolean }`. El producto debe pertenecer al usuario y tener `descripcion_texto` o `audio_ruta`.
- **Efecto:**
  1. Pasa el producto a `procesando`.
  2. Genera la `ficha` con el cliente de IA (ver «Proxy de IA») a partir del texto, o del audio si no hay texto.
  3. Si `mejorar_foto` es verdadero, guarda `mejorada.png` en `fotos`.
  4. Deja el producto en `en_revision`.
  5. Si falla, lo devuelve a `borrador` con `ia_error`.
- **Salida (200):** `{ estado, ficha, foto_mejorada_ruta | null, advertencias: string[] }`. Si falla solo la mejora de la foto, la ficha se entrega igual y se agrega una advertencia.
- **Errores:**
  - `400 entrada_invalida`
  - `401 no_autenticado`
  - `403 no_es_dueno`
  - `409 estado_invalido`: el producto no está en `borrador` ni en `en_revision`.
  - `502 ia_no_disponible`: el producto queda en `borrador`.
  - `429 limite_ia`: se superó el límite de llamadas a la IA por producto **(supuesto: 3 por producto)**.
- **Secretos:** `OPENROUTER_API_KEY`, `IA_BASE_URL`, `IA_API_KEY` e `IA_TIMEOUT_MS`, solo en el entorno de la función.
- **Usado por:** CU-03.

### Transiciones de orden
- **Tipo:** funciones Postgres llamadas por RPC (`supabase.rpc`). Validan el actor, el estado actual y las reglas 8–10 de `docs/dominio.md` dentro de una transacción.

| Función | Actor | Desde → hacia | Entrada adicional |
| --- | --- | --- | --- |
| `crear_orden` | comprador | — → `solicitada` | `producto_id, cantidad, modalidad, datos_envio?, detalle?` |
| `aceptar_orden` | artesano | `solicitada` → `aceptada` (reserva el stock) | `costo_envio?, total, fecha_entrega_estimada` |
| `rechazar_orden` | artesano | `solicitada` → `rechazada` | `motivo?` |
| `confirmar_total` | comprador | `aceptada` → `confirmada` | — |
| `enviar_enlace_pago` | artesano | `confirmada` → `pago_pendiente` (fija `reserva_vence_en`) | `enlace_pago` |
| `verificar_abono` | artesano | `pago_pendiente` → `pagada` | — |
| `marcar_enviada` | artesano | `pagada` → `enviada` | `numero_guia` |
| `marcar_lista_recojo` | artesano | `pagada` → `lista_para_recojo` | — |
| `marcar_entregada` | artesano | `enviada` / `lista_para_recojo` → `entregada` | — |
| `cancelar_orden` | cualquiera de las partes | `aceptada` / `confirmada` / `pago_pendiente` → `cancelada` (libera la reserva) | `motivo?` |

- **Vencimiento:** al leer una orden en `pago_pendiente` con `reserva_vence_en < now()`, la función `obtener_orden` (o la vista `orden_vigente`) la pasa a `vencida` y libera la reserva.
- **Errores:** excepción de Postgres con código en el mensaje: `transicion_invalida`, `no_autorizado`, `stock_insuficiente`, `datos_incompletos`, `reserva_vencida`.
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
  - `costearte-texto`: ficha y traducción.
  - `costearte-audio`: audio como bloque `file` con data URI base64.
- **Respaldo:** si el proxy excede `IA_TIMEOUT_MS` (por defecto 8000), devuelve 5xx o `IA_BASE_URL` no está definida, la misma petición va a OpenRouter (`https://openrouter.ai/api/v1/chat/completions`, `OPENROUTER_API_KEY`) con el modelo equivalente.
- **Imagen:** la mejora de la foto va siempre directo a OpenRouter (`POST /api/v1/images`, `google/gemini-2.5-flash-image`).
- **Usado por:** CU-03, CU-08.
- **Responsable:** Cristopher.

### Sincronización del borrador local (APK → Supabase)
- **Tipo:** módulo del cliente.
- **Pasos:**
  1. Sube la foto, y el audio si existe, a Storage con `upsert`.
  2. Hace `upsert` del `producto` con el mismo `id` local y estado `borrador`.
  3. Marca el borrador local como sincronizado.
  4. Solo entonces lo borra del celular.
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
  "ficha": { "descripcion": "Poncho-toalla de algodón para surfistas…", "materiales": ["algodón"],
             "tecnica": "costura", "tipo_producto": "textil", "historia_pieza": "…" },
  "foto_mejorada_ruta": "a1b2…/8c1f…/mejorada.png", "advertencias": [] }
// 502
{ "error": "ia_no_disponible", "mensaje": "No pudimos preparar tu producto. Puedes reintentar o completarlo a mano." }
```

## Convenciones
- **Fechas:** `timestamptz` en UTC; formato ISO 8601 en JSON. Se muestran en la zona `America/Lima`.
- **Identificadores:** uuid v4. Los del producto los genera el cliente.
- **Montos:** `numeric(10,2)` en PEN; en JSON se envían como número.
- **Nombres:** `snake_case` en la base de datos y en JSON, tomados de `docs/dominio.md`. Sin sinónimos.
- **Lugares (filtro, preliminar):** Máncora, Lobitos, Cabo Blanco, El Ñuro, Los Órganos, El Alto, Pariñas, Colán, Punta Sal. **Pendiente** confirmar con La Vaca Loca la lista definitiva y si Punta Sal tiene artesanos.
- **Errores de la Edge Function:** `{ error: "<codigo>", mensaje: "<texto para mostrar>" }`.
- **Variables de entorno** (solo nombres, en `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente; es la "publishable key" que nombra la guía actual de Supabase), `VITE_WEB_URL` (cliente, opcional: URL pública de la web, que la APK usa para enlazar al registro) y `OPENROUTER_API_KEY`, `IA_BASE_URL`, `IA_API_KEY`, `IA_TIMEOUT_MS` (solo en las Edge Functions). En el servidor del proxy (`infra/litellm/.env.example`): `LITELLM_MASTER_KEY` e `IA_KEY_1…n`.
