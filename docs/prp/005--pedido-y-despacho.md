# PRP 005 — Pedido, datos de despacho e hilo de la orden

- Caso de uso: CU-05 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo
- Rama: `cu-05/pedido-despacho`

## Objetivo
1. Desde la ficha de un producto, el comprador pulsa «Pedir» e inicia sesión con Google si no la tenía.
2. Elige la cantidad, escribe un detalle de personalización y elige recojo o envío. Si elige envío, completa un formulario guiado con los datos de despacho.
3. Se crea la orden en estado `solicitada`.
4. Comprador y artesano ven la orden y pueden escribirse en su hilo: el comprador desde la web, el artesano desde la APK en «Mis pedidos».

## Por qué
Es el criterio 4 del reto: estructurar la orden y los datos de despacho por agencia. También cubre el camino de «necesita orientación» mediante el hilo de la orden, en lugar de un chat libre (`revision-alcance.md` §2).

## Criterios de aceptación
- [ ] Un visitante que pulsa «Pedir» pasa por el login y vuelve a la misma ficha con el formulario abierto.
- [ ] `crear_orden` (RPC) valida:
  - Que el producto esté publicado.
  - Que `cantidad` sea ≥ 1.
  - Si la modalidad es `envio`, que estén todos los campos obligatorios de `datos_envio`.
  - Que el comprador no sea el artesano dueño del producto.
  - Si falla, devuelve `datos_incompletos` o `transicion_invalida`.
- [ ] Crear una orden **no** descuenta stock: la reserva ocurre al aceptarla (PRP 006).
- [ ] El comprador ve «Mis pedidos» en la web y el artesano ve «Mis pedidos» en la APK, cada uno con su estado. Nadie ve órdenes ajenas; hay una prueba RLS que lo verifica.
- [ ] Solo las dos partes de una orden pueden escribir y leer su hilo. Los mensajes tienen entre 1 y 1000 caracteres.
- [ ] El formulario de envío explica cada campo con lenguaje simple y no pide DNI, porque es un requisito no verificado.
- [ ] El total y los datos de envío se muestran desde los campos de la orden, no desde los mensajes (regla 12).

## Contexto necesario
- **Dominio:** Orden, Modalidad, Datos de envío, Mensaje de la orden; estados de la Orden; reglas 2 y 12.
- **Contratos:** `docs/contratos.md` §`orden`, §Datos de envío, §`mensaje_orden`, §Transiciones de orden (`crear_orden`), §Permisos.
- **Decisiones:** `revision-alcance.md` §2 (hilo dentro de la orden en lugar de chat libre).
- **Código existente a imitar:** `src/vitrina/FichaProducto.tsx` (PRP 004); `src/acceso/sesion.ts` (PRP 001).
- **Documentación externa:**
  - https://supabase.com/docs/guides/database/functions: funciones `security definer` y `search_path`.
  - https://supabase.com/docs/reference/javascript/rpc.
  - https://supabase.com/docs/guides/realtime: opcional, para refrescar el hilo. Si complica, se refresca al enviar y con un botón.
- **Trampas conocidas:**
  - **Funciones `security definer`:** deben fijar `set search_path = public` y validar `auth.uid()` dentro de la función.
  - **Fecha de creación:** no confiar en `creado_en` enviado por el cliente; usar `default now()`.
  - **Copia del artesano:** `artesano_id` se copia del producto dentro de la RPC, nunca se toma de la entrada.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0005_orden.sql` | tipos `modalidad` y `estado_orden`; tablas `orden` y `mensaje_orden`; RLS; RPC `crear_orden` |
| crear | `supabase/tests/orden_crear.test.sql` | pgTAP: validaciones de `crear_orden`; RLS de órdenes y mensajes |
| crear | `src/compartido/dominio/orden.ts` | tipos TS de Orden, DatosEnvio y MensajeOrden |
| crear | `src/pedidos/datosEnvio.ts`, `src/pedidos/datosEnvio.test.ts` | validación de los datos de envío |
| crear | `src/pedidos/consultas.ts` | crear la orden, listar, obtener, enviar y leer mensajes |
| crear | `src/pedidos/FormularioPedido.tsx` | cantidad, detalle, modalidad y datos de envío |
| crear | `src/pedidos/MisPedidos.tsx` | lista compartida entre la web y la APK |
| crear | `src/pedidos/DetalleOrden.tsx` | datos estructurados más el hilo |
| crear | `src/pedidos/HiloMensajes.tsx` | lista y caja de texto |
| modificar | `src/vitrina/FichaProducto.tsx` | conectar el botón «Pedir» |
| modificar | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx` | rutas `/pedidos` y `/pedidos/:id` |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. La migración 0005 y su prueba pgTAP.
2. `orden.ts`, y `datosEnvio.ts` con sus pruebas.
3. `consultas.ts`, `FormularioPedido` y la conexión del botón «Pedir».
4. `MisPedidos`, `DetalleOrden` y `HiloMensajes` en las dos salidas.
5. `make apk` y probar con dos dispositivos.

## Validación
1. `make verify` y pgTAP.
2. **Pruebas a crear:**
   - `datosEnvio`: completo; falta el teléfono; modalidad recojo sin datos de envío (válido).
   - pgTAP: pedir un producto no publicado; pedir el propio producto; leer órdenes ajenas.
3. **Prueba manual:**
   - El comprador en la web pide con envío → el artesano lo ve en la APK → intercambian un mensaje en cada sentido.

## Fuera de alcance
- Traducción de mensajes (PRP 008).
- Notificaciones push o por correo.
- Integración con Shalom.

## Notas / riesgos
- Sin notificaciones, el artesano debe abrir la APK para ver pedidos nuevos. Para la demo se acepta; anotarlo como siguiente paso.
