# Product

<!-- impeccable:product-schema 1 -->

Fuente de verdad detallada: `docs/proyecto.md`, `docs/dominio.md`, `docs/revision-alcance.md`. Este archivo resume lo durable para el diseño.

## Platform

web

La web del comprador y la APK del artesano salen del mismo código React. La APK es un contenedor Capacitor de la web: su lenguaje visual es web, no nativo de Android. El dispositivo prioritario del artesano es un celular Android (≥ 7).

## Users

- **Artesano o artesana** de las playas y caletas del norte de Piura y Talara (Máncora, Lobitos, Cabo Blanco, El Ñuro, Los Órganos, El Alto, Pariñas, Colán, Punta Sal). Produce en su casa (estimación oral de la entrevista: 90 %), a pedido y personalizado; pertenece a asociaciones de 15 a 30 personas. Usa WhatsApp estándar. Tiene poco dominio digital: aprende en capacitaciones presenciales, paso a paso, y no con videos ni tutoriales. Puede estar sin señal (Cabo Blanco no tiene cobertura). Su tarea: fotografiar y describir una pieza, calcular su precio, recibir pedidos, cobrar y despachar.
- **Comprador o turista** nacional o extranjero. Llega muchas veces por un QR en las vans de La Vaca Loca Tours. Su tarea: descubrir piezas y a quién las hace, confiar en ese artesano, pedir con recojo o envío y pagar por enlace.
- **Administrador**: revisa a mano el RNA declarado y aprueba o rechaza la acreditación.

## Product Purpose

Ser una vitrina digital para pequeños artesanos que hoy venden solo en persona (en su casa, en ferias de temporada o por referidos), con un camino corto que va de la pieza fotografiada a un pedido pagado y despachado. El éxito en la demo: un borrador creado sin señal, procesado con IA y publicado, y una orden que llega a pagada y enviada.

## Positioning

- La pieza nace en el celular del artesano incluso sin señal. La IA ordena la foto y la ficha sin cambiar la pieza: la foto original siempre se conserva.
- Muestra a la persona y el lugar detrás de cada pieza, con el RNA verificado como sello de confianza. PromPerú, en cambio, atiende piezas caras de artesanos destacados.

## Operating Context

- **Artesano:** celular Android de gama media o baja, muchas veces al aire libre o en su casa, con señal intermitente.
- **Comprador:** celular, a menudo después de escanear un QR durante un tour, o laptop.
- **Pedido:** se coordina en el hilo de la orden y por WhatsApp; se paga con un enlace del vendedor (por ejemplo, Izipay) que él mismo verifica a mano; se despacha por agencia de encomiendas (por ejemplo, Shalom).

## Capabilities and Constraints

- Ver `docs/plan.md` (CU-00 a CU-10) y `docs/contratos.md`.
- Términos del dominio, en español y sin sinónimos: artesano, comprador, producto, ficha, borrador, orden, acreditación, RNA, lugar, asociación.
- Sin pasarela de pago integrada; sin integración con Shalom; sin comisión por venta.
- No usar datos del padrón ni de personas reales. Los datos de demo son ficticios y deben estar rotulados.

## Brand Commitments

- Nombre: **CosteARTE**.
- Sin logo, colores ni tipografía previos: el equipo confirmó (2026-10-10) que la identidad parte de cero.
- No usar la marca de La Vaca Loca Tours sin su permiso.

## Evidence on Hand

- Entrevista a Daniela Acuña Carrasco (La Vaca Loca Tours). No hay testimonios, fotos de producto reales ni métricas publicables: no se inventan. Tipos de producto según el reto: tejidos a palillo y crochet, bisutería marina, tallado en madera de balsa y artesanía utilitaria (por ejemplo, ponchos-toalla para surfistas).

## Product Principles

1. **Un paso por pantalla para el artesano**, con botones grandes y palabras simples; sin depender de la señal.
2. **La pieza real manda:** la IA mejora la presentación, nunca altera color, forma ni textura.
3. **Confianza visible:** quién hizo la pieza, dónde y con qué RNA, antes que el precio.
4. **Acuerdos en datos, no en charla:** total, plazo y envío viven en campos claros.

## Accessibility & Inclusion

- Usuarios con poca experiencia digital: textos cortos y concretos, objetivos táctiles de al menos 48 px y estados claros (guardado en el celular, sincronizado, error).
- Uso al sol en celular: contraste alto (al menos WCAG AA) y texto base de 18 px o más en la APK.
- Interfaz en español. Los compradores extranjeros pueden necesitar traducción (CU-08, opcional).
