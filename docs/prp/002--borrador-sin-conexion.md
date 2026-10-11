# PRP 002 — Borrador de producto sin conexión

- Caso de uso: CU-02 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (actualizado por CC-09 y CC-11). Módulo A; requiere el PRP 001 en `main`
- Rama: `cu-02/borrador-sin-conexion`

## Objetivo
En la APK, aun en modo avión, el artesano completa un borrador y lo guarda en el celular:
1. Escribe el nombre.
2. Toma o adjunta una foto.
3. Graba la descripción en audio, o la dicta o la escribe si hay conexión.
4. Llena la calculadora y obtiene un precio sugerido; luego fija el precio final.
5. Define la disponibilidad: pieza lista (`en_stock`) o a pedido con un plazo.

Al recuperar la conexión, el borrador se sincroniza a Supabase y queda como `producto` en estado `borrador`.

## Por qué
Es el criterio 2 del reto («digitalizar en pocos pasos») y responde a la conectividad limitada de las caletas, como Cabo Blanco según [T]. La calculadora ataca el costeo incompleto (ejemplo de [T]: S/15 de hilo para una blusa vendida a S/20).

## Criterios de aceptación
- [ ] En modo avión se crea un borrador con nombre, foto y audio. Se cierra la app, se reabre y el borrador sigue completo.
- [ ] La calculadora muestra el precio sugerido = materiales + horas × pago por hora + gastos + ganancia, con 2 decimales. El precio final es editable, debe ser > 0 y puede diferir del sugerido. El precio sugerido se calcula en el cliente y no se guarda (3FN, CC-09).
- [ ] Si el precio final es menor que el costo (materiales + horas × pago por hora + gastos), la calculadora muestra «Con este precio pierdes dinero» sin bloquear (CC-09).
- [ ] Disponibilidad: `en_stock` no pide cantidad y `a_pedido` exige un plazo en días > 0 (CC-09).
- [ ] Con conexión, «Dictar» transcribe en vivo (español) al campo de descripción. Sin conexión, ese botón se oculta y se ofrece «Grabar audio».
- [ ] Al sincronizar, la foto (comprimida, lado mayor de 1600 px) y el audio se suben a Storage, el `producto` queda con el mismo `id` local y la foto queda como fila `original` de `foto_producto` (con `publicada = true`). Repetir la sincronización no duplica nada (idempotente).
- [ ] Si la subida falla a medias, el borrador local sigue `pendiente` y se reintenta. Solo se borra del celular tras la confirmación del servidor.
- [ ] (Esquema y pgTAP del PRP 012, no se repiten aquí.) La base de datos rechaza pasar un producto a `publicado` si el artesano no tiene la acreditación `aprobada`, si `revision_ia = rechazada` o si no tiene ninguna foto publicada. Hay pruebas pgTAP que lo verifican.
- [ ] El artesano no puede escribir `revision_ia`, `comentario_precio_ia`, `ia_error` ni `ia_intentos`, ni borrar su foto original. Hay una prueba pgTAP que lo verifica.
- [ ] `descripcion_texto` tiene un máximo de 2000 caracteres en la base y en el formulario.
- [ ] Cada borrador muestra su estado en «Mis productos»: «Guardado en el celular», «Sincronizado» o «Error al sincronizar».

## Contexto necesario
- **Dominio:** Borrador local, Producto, Costeo, Precio sugerido o final, Disponibilidad, Descripción hablada; reglas 1, 5, 6, 7 y 14.
- **Contratos:** `docs/contratos.md` §`producto`, §`foto_producto`, §Archivos, §Sincronización del borrador local, §Normalización.
- **Decisiones:** `0001-stack.md` (vía combinada de voz; IndexedDB/Dexie).
- **Código existente a imitar:** `src/acceso/perfil.ts` (PRP 001): acceso a Supabase y validación.
- **Documentación externa:**
  - https://dexie.org/docs/Tutorial/React: tablas y `useLiveQuery`.
  - https://github.com/capacitor-community/speech-recognition: `start({ language, partialResults })` y permisos.
  - https://capacitorjs.com/docs/apis/camera: `getPhoto`.
  - https://capacitorjs.com/docs/apis/network: `addListener('networkStatusChange')`.
  - https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder: grabación de audio.
- **Trampas conocidas:**
  - **Formato del audio:** guardar el `Blob` en Dexie (IndexedDB acepta Blobs) con su `mimeType` real, según el resultado de la prueba del PRP 000.
  - **Permisos:** `getUserMedia` dentro del WebView necesita `RECORD_AUDIO` en el manifiesto y el permiso concedido en tiempo de ejecución. La cámara necesita `CAMERA`.
  - **Idioma del dictado:** `getSupportedLanguages()` no existe en Android 13+, así que se fija `es-PE` y, si falla, se usa `es-ES` como respaldo.
  - **Persistencia:** llamar a `navigator.storage.persist()` al iniciar. Aunque se conceda, la regla 14 sigue aplicándose.
  - **Cálculos en soles:** redondear al final, no en cada suma parcial.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `src/borradores/costeo.ts`, `src/borradores/costeo.test.ts` | cálculo del costo y del precio sugerido, aviso de pérdida y validaciones |
| crear | `src/borradores/db.ts` | esquema Dexie `borrador_local` |
| crear | `src/borradores/comprimirFoto.ts` | redimensiona y convierte a JPEG 0,8 |
| crear | `src/borradores/audio.ts` | grabar y detener con MediaRecorder; dictado con el plugin |
| crear | `src/borradores/sincronizar.ts`, `src/borradores/sincronizar.test.ts` | cola de subida idempotente: archivos, `producto` y foto `original` (Supabase simulado en las pruebas) |
| crear | `src/borradores/MisProductos.tsx` | lista con estados y botón «Nuevo» |
| crear | `src/borradores/EditorBorrador.tsx` | pasos: nombre → foto → descripción → calculadora → disponibilidad → guardar |
| crear | `src/borradores/Calculadora.tsx` | campos grandes, en soles, con el resultado y el aviso de pérdida visibles |
| modificar | `src/borradores/rutas.tsx` | rutas `/`, `/nuevo`, `/borrador/:id` y la entrada «Mis productos» del menú |
| crear | `src/borradores/borradores.css` | estilos propios con los tokens |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Confirmar que el esquema y los tipos del PRP 012 están en `main`.
2. `costeo.ts` con sus pruebas, empezando por las pruebas.
3. `db.ts` (Dexie) y `comprimirFoto.ts`.
4. `audio.ts`: grabación sin conexión y dictado con conexión.
5. `EditorBorrador`, `Calculadora` y `MisProductos`. Interfaz para poca destreza digital: un paso por pantalla, botones grandes y textos cortos.
6. `sincronizar.ts` con sus pruebas. Se dispara al recuperar la red y con el botón «Sincronizar».
7. Ejecutar `make apk` (los plugins y permisos ya vienen del PRP 012) y probar en el Android.

## Validación
1. `make verify` y `supabase test db` (o pgTAP en remoto).
2. **Pruebas a crear:**
   - `costeo`: caso feliz; valores negativos o vacíos; redondeo de .005; precio final menor que el costo.
   - `sincronizar`: éxito; falla la foto; falla el upsert del producto; falla el upsert de la foto original; reintento sin duplicar.
3. **Prueba manual en el Android:**
   - Modo avión → crear un borrador completo → cerrar y reabrir → sigue ahí.
   - Quitar el modo avión → pasa a «Sincronizado» → la fila y los archivos aparecen en Supabase.

## Fuera de alcance
- Procesamiento con IA y publicación (PRP 003).
- Edición en varios dispositivos y resolución de conflictos.
- Más de una foto tomada por el artesano: las variantes las genera la IA (PRP 003).
- Cantidad en stock y reservas (CC-09).

## Notas / riesgos
- Si el dictado no funciona en español en el dispositivo de prueba, el artesano escribe a mano y se avisa para ajustar la demo.
