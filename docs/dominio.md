# Glosario del dominio

Fuentes: entrevista a Daniela Acuña ([T]), texto del reto 17, `docs/revision-alcance.md`, `docs/cambios/CC-01.md` y `docs/cambios/CC-09.md`.

Las marcas **(supuesto)** indican decisiones del equipo que aún no se han validado con usuarios.

| Término | Definición | Nombre en el código | No confundir con |
| --- | --- | --- | --- |
| Artesano | Persona que elabora y vende sus productos; usa la APK. | `artesano` (valor de `rol`) | Asociación |
| Comprador | Turista o cliente que explora la vitrina web y hace pedidos. | `comprador` (valor de `rol`) | Visitante (sin cuenta) |
| Contraseña del artesano | Clave que el artesano define en la APK, al crear su cuenta con correo o después de entrar con Google; con ella y su correo vuelve a entrar. | — (Supabase Auth) | Cuenta de Google |
| Visitante | Persona que ve el catálogo sin iniciar sesión. No puede pedir. | — (sin sesión) | Comprador |
| Administrador | Persona del equipo operador que revisa el RNA y aprueba la acreditación. | `admin` (valor de `rol`) | Líder de asociación (pospuesto) |
| Perfil | Datos de un usuario autenticado: rol, nombre, contacto y datos de artesano. | `perfil` | Usuario de Auth (`auth.users`) |
| RNA | Registro Nacional del Artesano (MINCETUR). En el MVP el artesano declara su número y el administrador lo revisa a mano. | `rna_numero` | Acreditación, RUC |
| Acreditación | Resultado de la revisión del administrador; habilita a publicar. | `acreditacion` | RNA |
| Asociación | Agrupación zonal de artesanos (15–30 según [T]). En el MVP es texto del perfil, sin gestión propia. | `asociacion` | Comité de feria |
| Lugar | Playa o caleta donde trabaja el artesano. Se usa como filtro. | `lugar` | Dirección de envío |
| Producto | Pieza publicable de un artesano, con foto, ficha, precio y disponibilidad. | `producto` | Borrador local |
| Borrador local | Producto en creación guardado solo en el celular, sin conexión, hasta que se sincroniza. | `borrador_local` | Producto en estado `borrador` |
| Ficha | Descripción estructurada del producto: título comercial, descripción, materiales, técnica, tipo, historia y etiquetas. | `ficha` | Perfil |
| Etiqueta | Palabra corta que la IA propone y el artesano corrige, para buscar y filtrar en la vitrina (por ejemplo, `filigrana`). | `etiquetas` (dentro de `ficha`) | Tipo de producto |
| Revisión de la IA | Resultado del filtro de artesanía y moderación: sin revisar, aprobada o rechazada. Con `rechazada` no se publica. | `revision_ia` | Acreditación |
| Descripción hablada | Texto que dicta el artesano, o audio grabado sin conexión, a partir del cual la IA arma la ficha. | `descripcion_texto`, `audio_ruta` | Ficha |
| Foto original | Foto tal como la tomó el artesano. Nunca se borra ni se sobrescribe. | `foto_producto` con `origen = original` | Foto de IA |
| Foto de IA | Una de hasta 4 variantes (estudio, luz, vitrina, contexto) que la IA genera a partir de la original. Solo se publica si el artesano la elige. | `foto_producto` con `origen = ia` | Foto original |
| Foto publicada | Foto que el artesano eligió mostrar en la vitrina. Puede ser la original o una de IA. | `publicada` | Foto original |
| Tipo de producto | Categoría para filtrar: textil, bisutería marina, tallado, utilitario, otro **(supuesto: lista tomada del texto del reto)**. | `tipo_producto` | Material |
| Costeo | Cálculo que hace el artesano: materiales + horas × pago por hora + gastos adicionales + ganancia. | `costeo` | Precio final |
| Precio sugerido | Resultado del costeo. Se calcula, no se guarda. | — (calculado desde `costeo`) | Precio final |
| Comentario de precio | Observación breve de la IA sobre si el precio cubre costos y margen. Solo es una referencia. | `comentario_precio_ia` | Precio sugerido |
| Precio final | Precio que decide el artesano. Puede diferir del sugerido. | `precio_final` | Total de la orden |
| Disponibilidad | Si la pieza está lista para entregar, o si se fabrica a pedido con un plazo en días. No se lleva cantidad. | `disponibilidad` (`en_stock` / `a_pedido`) | Cantidad pedida |
| Orden | Pedido de un comprador sobre un producto, con su modalidad y estado. Funciona como un acuerdo o cotización con el artesano. | `orden` | Venta presencial |
| Modalidad | Cómo recibe el comprador: recojo en casa del artesano o envío por agencia. | `modalidad` (`recojo` / `envio`) | — |
| Datos de envío | Datos estructurados para despachar por una agencia de encomiendas (por ejemplo, Shalom). | `datos_envio` | Dirección del artesano |
| Enlace de pago | URL de cobro que genera el artesano en su proveedor (por ejemplo, un link individual de Izipay) y pega en la orden. | `enlace_pago` | Pasarela integrada (fuera de alcance) |
| Abono verificado | Confirmación del artesano de que el dinero llegó a su cuenta. | estado `pagada` | Captura de pantalla del comprador |
| Número de guía | Código que da la agencia al despachar. Se muestra junto al botón «Rastrear envío». | `numero_guia` | ID de la orden |
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
  - Significado de cada estado:
    - `aceptada`: el artesano confirma que puede atender el pedido y propone el total, incluido el envío, y la fecha estimada.
    - `confirmada`: el comprador acepta ese total.
    - `pago_pendiente`: el enlace de pago fue enviado.

## Reglas del negocio
1. Sin acreditación `aprobada`, el artesano puede crear y sincronizar borradores, pero no publicar.
2. Ver el catálogo no requiere cuenta. Pedir y escribir mensajes sí requieren iniciar sesión con Google como comprador.
3. La foto original se conserva siempre y la ficha pública siempre enlaza a ella. La vitrina muestra las fotos que el artesano elige publicar (al menos una).
4. El artesano siempre puede corregir la ficha y el precio antes de publicar. La IA no publica por su cuenta. Tampoco se publica un producto que la IA rechazó como no artesanal o inapropiado (`revision_ia = rechazada`); si la IA no está disponible, el artesano completa a mano y la acreditación sigue siendo el filtro (CC-09).
5. El precio final lo decide el artesano y debe ser mayor que 0. Los montos van en soles (PEN) con 2 decimales.
6. La ganancia del costeo se ingresa como monto en soles **(supuesto)**.
7. Un producto `a_pedido` requiere un plazo en días > 0. Un producto `en_stock` no lleva cantidad: si se agota, el artesano lo retira o lo pasa a `a_pedido` (CC-09).
8. Crear o aceptar una orden no reserva stock. Si dos compradores piden la misma pieza, el artesano acepta una orden y rechaza la otra.
9. El enlace de pago no vence en el sistema. Si el comprador no paga, cualquiera de las partes cancela la orden.
10. Solo el artesano de la orden puede marcarla `pagada`. Una captura del comprador no basta como prueba.
11. Si el abono llega después de cancelar la orden, se revisa a mano **(supuesto)**.
12. El total, el plazo y los datos de envío viven en campos estructurados de la orden, nunca solo en mensajes.
13. Si un mensaje se traduce, se guarda también el original y siempre puede verse.
14. El borrador local no se borra del celular hasta que el servidor confirma que lo recibió.
15. No se cargan datos del padrón en la aplicación. La demo usa datos ficticios.
