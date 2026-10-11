# PRP 006 — Confirmación, pago manual y despacho

- Caso de uso: CU-06 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (actualizado por CC-09: sin reserva de stock; CC-11). Módulo C; requiere el PRP 005 en `main`
- Rama: `cu-06/confirmacion-pago`

- Ejecución: Luis, por solicitud del usuario; responsable original sin cambios.
- Ampliación aprobada: CC-16, únicamente `src/pedidos/MisPedidos.tsx`.

## Objetivo
La orden recorre su ciclo completo como un acuerdo entre comprador y artesano, con botones claros para cada parte:
1. El artesano acepta y propone el total con envío y la fecha estimada, que la app prellena según el plazo y el destino.
2. El comprador confirma el total.
3. El artesano pega su enlace de pago (por ejemplo, Izipay, Yape o Plin).
4. El comprador abre el enlace y paga fuera del sistema.
5. El artesano verifica el abono y marca la orden como enviada (con número de guía; el comprador lo rastrea con un botón) o lista para recojo; luego, entregada.

No se reserva stock: si dos compradores piden la misma pieza, el artesano acepta una orden y rechaza la otra (CC-09).

## Por qué
Cierra los criterios 3 y 4 del reto (confirmación de abono digital y despacho). Una pieza artesanal se acuerda y personaliza en el hilo; un stock rígido no encaja con ese modelo (CC-09).

## Criterios de aceptación
- [ ] Están implementadas las RPC de la tabla «Transiciones de orden» de `contratos.md`, cada una con su actor y su estado de origen. Cualquier otra combinación devuelve `transicion_invalida` o `no_autorizado`.
- [ ] Cada RPC cambia el estado con `update … where estado = <origen>`; dos llamadas simultáneas a la misma transición dejan una sola aplicada y la otra recibe `transicion_invalida`.
- [ ] `aceptar_orden` exige `total > 0` y `fecha_entrega_estimada` ≥ hoy (hora de Lima); con `envio`, también `costo_envio ≥ 0`. No toca el producto.
- [ ] `enviar_enlace_pago` exige una URL `https://`.
- [ ] `marcar_enviada` exige `numero_guia` no vacío.
- [ ] Solo el artesano puede ejecutar `verificar_abono`. El comprador **no tiene** ningún botón «Ya pagué» que cambie el estado: puede escribirlo en el hilo, pero no es prueba (regla 10).
- [ ] En la interfaz, cada parte ve solo las acciones válidas para el estado actual, con textos simples y fechas en hora de Lima.
- [ ] Al aceptar, la fecha estimada se prellena con la regla de «Estimación de entrega» de `contratos.md` y el artesano la puede corregir.
- [ ] En una orden `enviada`, el comprador ve el número de guía y un botón «Rastrear envío» que abre `https://shalom.com.pe/rastrea` en una pestaña nueva (enlace fijo).
- [ ] Los cambios de estado llegan a la otra parte por Realtime (PRP 005).
- [ ] **Carga de trabajo (CC-10):** en la APK, «Mis pedidos» muestra cuántos pedidos tiene en curso (de `aceptada` a `pagada`). Al aceptar uno nuevo, si ya tiene 5 o más **(supuesto)**, aparece «Tienes N pedidos en curso. Revisa que puedas cumplir la fecha.» Solo avisa; no bloquea.

## Contexto necesario
- **Dominio:** Orden, Enlace de pago, Abono verificado, Número de guía; estados de la Orden; reglas 8–12.
- **Contratos:** `docs/contratos.md` §Transiciones de orden (concurrencia, Realtime), §`orden`, §Seguimiento del envío, §Estimación de entrega, §Convenciones (fechas en `America/Lima`).
- **Decisiones:** `revision-alcance.md` §2 (pago manual); `CC-09.md` (sin reserva, botón de rastreo, estimación); `CC-10.md` (aviso de carga de trabajo).
- **Código existente a imitar:** `supabase/migrations/0301_crear_orden.sql` (`crear_orden`); `src/pedidos/DetalleOrden.tsx`.
- **Documentación externa:**
  - https://www.izipay.pe/link-de-pago/: link individual por orden; sin API ni webhook documentados.
  - https://shalom.com.pe/rastrea: página de rastreo de Shalom, abierta desde un botón con enlace fijo.
- **Trampas conocidas:**
  - **Reglas solo en SQL:** la interfaz no decide las transiciones, solo oculta botones. La fuente de verdad son las RPC.
  - **Artesano de la orden:** se obtiene de `producto.artesano_id` (3FN, CC-09).
  - **Pagos tardíos:** si llega un abono después de cancelar la orden, la revisión es manual (supuesto, regla 11). En el MVP no hay flujo automático.
  - **Días de envío:** la tabla de «Estimación de entrega» es un supuesto; mantenerla en un solo módulo para cambiarla fácil.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0302_transiciones_orden.sql` | las RPC de transición restantes |
| crear | `supabase/tests/orden_transiciones.test.sql` | pgTAP: cada transición válida e inválida; actor incorrecto; datos incompletos; doble transición |
| crear | `src/pedidos/estadoOrden.ts`, `src/pedidos/estadoOrden.test.ts` | etiquetas y acciones visibles por rol y estado; conteo de pedidos en curso y umbral del aviso |
| crear | `src/pedidos/estimarEntrega.ts`, `src/pedidos/estimarEntrega.test.ts` | fecha estimada por plazo, modalidad y departamento |
| crear | `src/pedidos/acciones.ts` | invocaciones de las RPC y mensajes de error legibles |
| crear | `src/pedidos/AccionesArtesano.tsx` | aceptar (total, envío y fecha prellenada), rechazar, enlace, verificar, enviado/recojo, entregado |
| crear | `src/pedidos/AccionesComprador.tsx` | confirmar el total, abrir el enlace, cancelar, rastrear el envío |
| modificar | `src/pedidos/DetalleOrden.tsx` | integrar las acciones y el botón «Rastrear envío» |

| modificar | `src/pedidos/MisPedidos.tsx` | mostrar conteo de pedidos en curso en APK (CC-16) |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Las pruebas pgTAP de las transiciones, escritas primero (TDD).
2. La migración 0302 hasta que pasen.
3. `estadoOrden.ts` y `estimarEntrega.ts`, con sus pruebas primero.
4. `acciones.ts` y los componentes de acciones.
5. Recorrido completo con dos dispositivos.

## Validación
1. `make verify` y `make test-db`.
2. **Pruebas a crear:**
   - Caso feliz de punta a punta, con envío y con recojo.
   - El comprador intenta verificar el abono.
   - Transición desde un estado incorrecto y doble transición.
   - Enlace de pago sin `https`; envío sin número de guía.
   - `estimarEntrega`: `a_pedido` con envío a Lima; `en_stock` con recojo; departamento fuera de la tabla.
3. **Prueba manual:**
   - Dos compradores piden la misma pieza → el artesano acepta uno y rechaza al otro → el rechazado ve el estado al instante.
   - Recorrido completo hasta `entregada` con un enlace de prueba y un número de guía de prueba.

## Fuera de alcance
- Reserva de stock y vencimiento del enlace de pago (CC-09).
- Pasarela integrada o webhook de Izipay.
- Comisión por venta.
- Integración con la API de Shalom y estimación de entrega con IA.
- Flujo automático de pagos tardíos.

## Notas / riesgos
- El enlace de pago lo genera el artesano en su cuenta de Izipay (o similar). La plataforma no valida el pago.
