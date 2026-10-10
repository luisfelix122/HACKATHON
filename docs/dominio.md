# Glosario del dominio

Fuentes: entrevista a Daniela Acuña ([T]), texto del reto 17, `docs/revision-alcance.md` y `docs/cambios/CC-01.md`.

Las marcas **(supuesto)** indican decisiones del equipo que aún no se han validado con usuarios.

| Término | Definición | Nombre en el código | No confundir con |
| --- | --- | --- | --- |
| Artesano | Persona que elabora y vende sus productos; usa la APK. | `artesano` (valor de `rol`) | Asociación |
| Comprador | Turista o cliente que explora la vitrina web y hace pedidos. | `comprador` (valor de `rol`) | Visitante (sin cuenta) |
| Contraseña del artesano | Clave que el artesano define en la web tras crear su cuenta con Google; con ella y su correo entra a la APK. | — (Supabase Auth) | Cuenta de Google |
| Visitante | Persona que ve el catálogo sin iniciar sesión. No puede pedir. | — (sin sesión) | Comprador |
| Administrador | Persona del equipo operador que revisa el RNA y aprueba la acreditación. | `admin` (valor de `rol`) | Líder de asociación (pospuesto) |
| Perfil | Datos de un usuario autenticado: rol, nombre, contacto y datos de artesano. | `perfil` | Usuario de Auth (`auth.users`) |
| RNA | Registro Nacional del Artesano (MINCETUR). En el MVP el artesano declara su número y el administrador lo revisa a mano. | `rna_numero` | Acreditación, RUC |
| Acreditación | Resultado de la revisión del administrador; habilita a publicar. | `acreditacion` | RNA |
| Asociación | Agrupación zonal de artesanos (15–30 según [T]). En el MVP es texto del perfil, sin gestión propia. | `asociacion` | Comité de feria |
| Lugar | Playa o caleta donde trabaja el artesano. Se usa como filtro. | `lugar` | Dirección de envío |
| Producto | Pieza publicable de un artesano, con foto, ficha, precio y disponibilidad. | `producto` | Borrador local |
| Borrador local | Producto en creación guardado solo en el celular, sin conexión, hasta que se sincroniza. | `borrador_local` | Producto en estado `borrador` |
| Ficha | Descripción estructurada del producto: descripción, materiales, técnica, tipo e historia. | `ficha` | Perfil |
| Descripción hablada | Texto que dicta el artesano, o audio grabado sin conexión, a partir del cual la IA arma la ficha. | `descripcion_texto`, `audio_ruta` | Ficha |
| Foto original | Foto tal como la tomó el artesano. Nunca se borra. | `foto_original_ruta` | Foto mejorada |
| Foto mejorada | Propuesta de la IA con mejor luz y fondo. Solo se usa si el artesano la acepta. | `foto_mejorada_ruta` | Foto original |
| Tipo de producto | Categoría para filtrar: textil, bisutería marina, tallado, utilitario, otro **(supuesto: lista tomada del texto del reto)**. | `tipo_producto` | Material |
| Costeo | Cálculo que hace el artesano: materiales + horas × pago por hora + gastos adicionales + ganancia. | `costeo` | Precio final |
| Precio sugerido | Resultado del costeo. | `precio_sugerido` | Precio final |
| Precio final | Precio que decide el artesano. Puede diferir del sugerido. | `precio_final` | Total de la orden |
| Disponibilidad | Si hay stock con una cantidad, o si se fabrica a pedido con un plazo en días. | `disponibilidad` (`en_stock` / `a_pedido`) | Reserva |
| Orden | Pedido de un comprador sobre un producto, con su modalidad y estado. | `orden` | Venta presencial |
| Modalidad | Cómo recibe el comprador: recojo en casa del artesano o envío por agencia. | `modalidad` (`recojo` / `envio`) | — |
| Datos de envío | Datos estructurados para despachar por una agencia de encomiendas (por ejemplo, Shalom). | `datos_envio` | Dirección del artesano |
| Reserva | Unidades de stock apartadas para una orden aceptada. | `cantidad` de la orden + `reserva_vence_en` | Stock disponible |
| Enlace de pago | URL de cobro que genera el artesano en su proveedor (por ejemplo, un link individual de Izipay) y pega en la orden. | `enlace_pago` | Pasarela integrada (fuera de alcance) |
| Abono verificado | Confirmación del artesano de que el dinero llegó a su cuenta. | estado `pagada` | Captura de pantalla del comprador |
| Número de guía | Código que da la agencia al despachar. | `numero_guia` | ID de la orden |
| Mensaje de la orden | Texto que intercambian comprador y artesano dentro de una orden. | `mensaje_orden` | Chat libre (pospuesto) |

## Estados
- **Acreditación:** `pendiente` → `aprobada` | `rechazada`. Una rechazada puede volver a `pendiente` si el artesano corrige su RNA.
- **Producto:** `borrador` → `procesando` → `en_revision` → `publicado` → `retirado`.
  - Si la IA falla, el producto vuelve a `borrador` con un error registrado.
  - El artesano puede editar a mano desde `borrador` o `en_revision`.
- **Orden:**
  - Flujo normal: `solicitada` → `aceptada` → `confirmada` → `pago_pendiente` → `pagada` → `enviada` o `lista_para_recojo` → `entregada`.
  - `solicitada` → `rechazada`, por decisión del artesano.
  - `aceptada`, `confirmada` o `pago_pendiente` → `cancelada`, por decisión de cualquiera de las partes.
  - `pago_pendiente` → `vencida`, cuando pasan 24 h desde el envío del enlace sin abono verificado.
  - Significado de cada estado:
    - `aceptada`: el artesano confirma la disponibilidad y propone el total, incluido el envío.
    - `confirmada`: el comprador acepta ese total.
    - `pago_pendiente`: el enlace de pago fue enviado.

## Reglas del negocio
1. Sin acreditación `aprobada`, el artesano puede crear y sincronizar borradores, pero no publicar.
2. Ver el catálogo no requiere cuenta. Pedir y escribir mensajes sí requieren iniciar sesión con Google como comprador.
3. La foto original se conserva siempre. La foto mostrada es la original, salvo que el artesano elija la mejorada.
4. El artesano siempre puede corregir la ficha y el precio antes de publicar. La IA no publica por su cuenta.
5. El precio final lo decide el artesano y debe ser mayor que 0. Los montos van en soles (PEN) con 2 decimales.
6. La ganancia del costeo se ingresa como monto en soles **(supuesto)**.
7. Un producto `en_stock` requiere una cantidad ≥ 0. Un producto `a_pedido` requiere un plazo en días > 0.
8. Al pasar a `aceptada`, una orden de un producto `en_stock` reserva sus unidades. No se puede aceptar si `cantidad_disponible` es menor que la cantidad pedida.
9. La reserva vence 24 h después de pasar a `pago_pendiente`. Una orden vencida libera su reserva. El vencimiento se evalúa al leer la orden; no hay tareas programadas.
10. Solo el artesano de la orden puede marcarla `pagada`. Una captura del comprador no basta como prueba.
11. Si el abono llega después del vencimiento, se revisa a mano **(supuesto)**.
12. El total, el plazo y los datos de envío viven en campos estructurados de la orden, nunca solo en mensajes.
13. Si un mensaje se traduce, se guarda también el original y siempre puede verse.
14. El borrador local no se borra del celular hasta que el servidor confirma que lo recibió.
15. No se cargan datos del padrón en la aplicación. La demo usa datos ficticios.
