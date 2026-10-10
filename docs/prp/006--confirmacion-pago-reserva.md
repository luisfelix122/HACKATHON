# PRP 006 — Confirmación, reserva de stock y pago manual

- Caso de uso: CU-06 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo
- Rama: `cu-06/confirmacion-pago`

## Objetivo
La orden recorre su ciclo completo con botones claros para cada parte:
1. El artesano acepta (reserva el stock) y propone el total con envío y la fecha estimada.
2. El comprador confirma el total.
3. El artesano pega su enlace de pago; la reserva vence a las 24 h.
4. El comprador abre el enlace y paga fuera del sistema.
5. El artesano verifica el abono y marca la orden como enviada (con número de guía) o lista para recojo; luego, entregada.

Las cancelaciones y los vencimientos liberan la reserva.

## Por qué
Cierra los criterios 3 y 4 del reto (confirmación de abono digital y despacho). Aplica las reglas de stock y pago acordadas por el equipo.

## Criterios de aceptación
- [ ] Están implementadas las RPC de la tabla «Transiciones de orden» de `contratos.md`, cada una con su actor y su estado de origen. Cualquier otra combinación devuelve `transicion_invalida` o `no_autorizado`.
- [ ] `aceptar_orden` de un producto `en_stock` descuenta `cantidad_disponible` en una transacción con bloqueo de fila. Si no alcanza el stock, devuelve `stock_insuficiente`. Dos aceptaciones concurrentes no dejan stock negativo.
- [ ] `enviar_enlace_pago` exige una URL `https://` y fija `reserva_vence_en = now() + 24 h`.
- [ ] Una orden `pago_pendiente` vencida pasa a `vencida` y devuelve la reserva al leerla (`obtener_orden` o la vista). Después, `verificar_abono` sobre ella devuelve `reserva_vencida`.
- [ ] `cancelar_orden` libera la reserva y `rechazar_orden` no toca el stock.
- [ ] Solo el artesano puede ejecutar `verificar_abono`. El comprador **no tiene** ningún botón «Ya pagué» que cambie el estado: puede escribirlo en el hilo, pero no es prueba (regla 10).
- [ ] En la interfaz, cada parte ve solo las acciones válidas para el estado actual, con textos simples, y la hora de vencimiento de la reserva en hora de Lima.
- [ ] En las órdenes `a_pedido` no se reserva stock. La fecha estimada se calcula a partir de `plazo_dias`.

## Contexto necesario
- **Dominio:** Reserva, Enlace de pago, Abono verificado, Número de guía; estados de la Orden; reglas 8–12.
- **Contratos:** `docs/contratos.md` §Transiciones de orden, §`orden`, §Convenciones (fechas en `America/Lima`).
- **Decisiones:** `revision-alcance.md` §2 y §5 (stock y pago manual).
- **Código existente a imitar:** `supabase/migrations/0005_orden.sql` (`crear_orden`); `src/pedidos/DetalleOrden.tsx`.
- **Documentación externa:**
  - https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE: `select ... for update`.
  - https://www.izipay.pe/link-de-pago/: link individual por orden; sin API ni webhook documentados.
- **Trampas conocidas:**
  - **Reglas solo en SQL:** la interfaz no decide las transiciones, solo oculta botones. La fuente de verdad son las RPC.
  - **Vencimiento al leer:** se aplica con una función `vencer_si_corresponde(orden_id)` que se llama al inicio de cada RPC y en `obtener_orden`.
  - **Pagos tardíos:** si llega un abono después del vencimiento, la revisión es manual (supuesto, regla 11). En el MVP no hay flujo automático.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0006_transiciones_orden.sql` | `vencer_si_corresponde`, `obtener_orden` y las RPC de transición restantes |
| crear | `supabase/tests/orden_transiciones.test.sql` | pgTAP: cada transición válida e inválida; stock; vencimiento; concurrencia (dos aceptaciones) |
| crear | `src/pedidos/estadoOrden.ts`, `src/pedidos/estadoOrden.test.ts` | etiquetas y acciones visibles por rol y estado |
| crear | `src/pedidos/acciones.ts` | invocaciones de las RPC y mensajes de error legibles |
| crear | `src/pedidos/AccionesArtesano.tsx` | aceptar (total, envío y fecha), rechazar, enlace, verificar, enviado/recojo, entregado |
| crear | `src/pedidos/AccionesComprador.tsx` | confirmar el total, abrir el enlace, cancelar |
| modificar | `src/pedidos/DetalleOrden.tsx` | integrar las acciones y el vencimiento |
| modificar | `src/pedidos/consultas.ts` | usar `obtener_orden` |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Las pruebas pgTAP de las transiciones, escritas primero.
2. La migración 0006 hasta que pasen.
3. `estadoOrden.ts` con sus pruebas.
4. `acciones.ts` y los componentes de acciones.
5. Recorrido completo con dos dispositivos.

## Validación
1. `make verify` y pgTAP.
2. **Pruebas a crear:**
   - Caso feliz de punta a punta.
   - Stock insuficiente.
   - Vencimiento (simular `reserva_vence_en` en el pasado).
   - El comprador intenta verificar el abono.
   - Transición desde un estado incorrecto.
3. **Prueba manual:**
   - Producto con 1 unidad → dos compradores piden → el artesano acepta uno → el segundo recibe `stock_insuficiente`.
   - Recorrido completo hasta `entregada` con un enlace de prueba.

## Fuera de alcance
- Pasarela integrada o webhook de Izipay.
- Comisión por venta.
- Integración con Shalom.
- Flujo automático de pagos tardíos.

## Notas / riesgos
- El enlace de pago lo genera el artesano en su cuenta de Izipay (o similar). La plataforma no valida el pago.
