# PRP 003 — Procesamiento con IA, revisión y publicación

- Caso de uso: CU-03 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo
- Rama: `cu-03/ia-publicacion`

## Objetivo
Con un borrador ya sincronizado, el artesano pulsa «Preparar con IA» y recibe una ficha estructurada a partir de su descripción, junto con una foto mejorada opcional que se muestra al lado de la original.

Después revisa y corrige la ficha, elige qué foto usar, confirma el precio y la disponibilidad, y publica. Esto último solo es posible si su acreditación está `aprobada`.

## Por qué
Es el criterio 2 del reto: optimizar con IA la imagen, la ficha y el precio. Reduce la barrera de redactar y fotografiar que mencionó Daniela.

## Criterios de aceptación
- [ ] `procesar-producto` cumple el contrato de `docs/contratos.md`: entrada, efecto, salida y los errores 400, 401, 403, 409, 429 y 502.
- [ ] La ficha que devuelve la IA se valida contra el esquema: `descripcion` no vacía, `materiales` como arreglo de texto y `tipo_producto` dentro de la lista. Si no es válida, se reintenta una vez; si vuelve a fallar, responde `502` y el producto queda en `borrador`.
- [ ] La foto original nunca se sobrescribe. `usar_foto_mejorada` es `false` por defecto y la pantalla muestra las dos fotos lado a lado.
- [ ] Si falla solo la mejora de la foto, la ficha llega igual con una advertencia.
- [ ] Si no hay `descripcion_texto` pero sí `audio_ruta`, la función envía el audio en el formato validado en el PRP 000. Si ese formato no es compatible, responde `400 entrada_invalida` con el mensaje «Dicta o escribe la descripción».
- [ ] El artesano puede editar todos los campos de la ficha y el precio antes de publicar. Si su acreditación no está `aprobada`, «Publicar» se ve deshabilitado con el motivo, y la base de datos también lo rechaza.
- [ ] Si la IA falla, la pantalla ofrece «Reintentar» y «Completar a mano». Si no hay conexión, el reintento se hace solo al volver la red.
- [ ] Las claves (`IA_API_KEY`, `OPENROUTER_API_KEY`) solo existen como secretos de la función. Una búsqueda de `OPENROUTER` o `IA_API_KEY` en `src/` y `dist-*/` no encuentra nada.
- [ ] El texto y el audio van al proxy LiteLLM (`${IA_BASE_URL}/v1/chat/completions`, alias `ayllu-texto` o `ayllu-audio`). Si el proxy no responde en `IA_TIMEOUT_MS` o devuelve 5xx, se reintenta **una vez** directo con OpenRouter. Si `IA_BASE_URL` no está definida, se usa OpenRouter directo. Hay pruebas para los tres caminos.
- [ ] La mejora de la foto va directo a OpenRouter (`/api/v1/images`), según la decisión 0002.

## Contexto necesario
- **Dominio:** Ficha, Foto original o mejorada, Descripción hablada; estados del Producto; reglas 1, 3 y 4.
- **Contratos:** `docs/contratos.md` §Procesar producto con IA, §`producto` (`ia_error`, `ia_intentos`), §Archivos.
- **Decisiones:** `0001-stack.md`, `0002-proxy-ia-litellm.md` (CC-02), `docs/revision-alcance.md` §5 (fidelidad de la foto).
- **Depende de:** el PRP 009 para el camino por el proxy. Sin él, el PRP 003 funciona con OpenRouter directo y no se bloquea.
- **Código existente a imitar:** `src/borradores/sincronizar.ts` (PRP 002): llamadas a Supabase y manejo de errores.
- **Documentación externa:**
  - https://openrouter.ai/docs/features/multimodal/image-generation: `POST /api/v1/images`, `input_references`, `google/gemini-2.5-flash-image`, respuesta `data[].b64_json`.
  - https://openrouter.ai/docs/features/multimodal/audio: `input_audio` en base64.
  - https://supabase.com/docs/guides/functions: estructura, secretos (`supabase secrets set`), CORS, `supabase functions deploy`.
- **Trampas conocidas:**
  - **El modelo de imagen regenera píxeles.** El prompt debe pedir explícitamente conservar el color, la forma, la textura y los detalles, y cambiar solo la luz y el fondo. Aun así, la decisión final la toma el artesano (regla 3).
  - **Formato de la ficha:** pedir JSON estricto y validarlo; no confiar en la forma de la respuesta.
  - **Permisos de la función:** usar la *service role key* solo dentro de la función, para escribir en `fotos`. Comprobar que el JWT del llamante es el dueño del producto **antes** de usarla.
  - **Límite de llamadas:** 3 por producto (`ia_intentos`), supuesto de `contratos.md`.
  - **Pruebas:** la lógica pura (prompt, validación de la ficha, lectura de la respuesta) va en módulos sin APIs de Deno, para probarla con Vitest.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0003_producto_ia.sql` | trigger `transicion_producto_valida` (solo transiciones de estado del dominio) |
| crear | `supabase/functions/procesar-producto/index.ts` | handler HTTP: autenticación, dueño, estados, llamadas y guardado |
| crear | `supabase/functions/procesar-producto/ficha.ts` | prompt de la ficha, esquema y validación (sin APIs de Deno) |
| crear | `supabase/functions/procesar-producto/ficha.test.ts` | Vitest: JSON válido, inválido, tipo fuera de la lista |
| crear | `supabase/functions/_compartido/ia.ts` | cliente de IA: proxy con timeout y respaldo a OpenRouter para texto y audio; imagen directo a OpenRouter (con `fetch`). Lo reutiliza el PRP 008 |
| crear | `supabase/functions/_compartido/ia.test.ts` | Vitest con `fetch` simulado: proxy correcto; proxy con timeout → respaldo; proxy con 5xx → respaldo; sin `IA_BASE_URL` |
| crear | `src/publicacion/procesar.ts` | invocación y reintento al reconectar |
| crear | `src/publicacion/RevisarProducto.tsx` | ficha editable, comparación de fotos, precio, disponibilidad y botón Publicar |
| crear | `src/publicacion/CompararFotos.tsx` | original y mejorada lado a lado, con selector |
| crear | `src/publicacion/publicar.ts`, `src/publicacion/publicar.test.ts` | validación previa a publicar (campos obligatorios de `contratos.md`) |
| modificar | `src/app/AppArtesano.tsx` | ruta `/revisar/:id` |
| modificar | `vite.config.ts` | incluir `supabase/functions/**/*.test.ts` en Vitest |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. `ficha.ts` con sus pruebas, empezando por las pruebas.
2. `_compartido/ia.ts` con sus pruebas, e `index.ts`. Cristopher configura los secretos con `supabase secrets set OPENROUTER_API_KEY=... IA_BASE_URL=... IA_API_KEY=... IA_TIMEOUT_MS=8000` (los valores no van al repo). Desplegar.
3. La migración 0003.
4. `procesar.ts`, `CompararFotos`, `RevisarProducto`, y `publicar.ts` con sus pruebas.
5. Probar de punta a punta en el Android con un producto real.

## Validación
1. `make verify`.
2. **Pruebas a crear:**
   - `ficha`: caso feliz; JSON roto; campo faltante; `tipo_producto` inválido.
   - `publicar`: sin precio; sin disponibilidad; acreditación no aprobada.
3. **Prueba manual:**
   - Borrador sincronizado → «Preparar con IA» → ver la ficha y las dos fotos → corregir el precio → Publicar → aparece en la vitrina (PRP 004).
   - Con la clave inválida → error, «Completar a mano» → publicar igual.

## Fuera de alcance
- Traducción de la ficha a otros idiomas.
- Precio sugerido por la IA: el precio sale de la calculadora y lo decide el artesano.
- Moderación de contenido.

## Notas / riesgos
- El costo por llamada depende del modelo y no se ha medido. Registrar en Notas el consumo observado durante las pruebas.
