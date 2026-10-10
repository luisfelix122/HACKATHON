# Ayllu — Vitrina digital para artesanos de las playas del norte

Fuentes:
- Reto 17 (texto oficial).
- Entrevista a Daniela Acuña Carrasco, gerente general de La Vaca Loca Tours y mentora del reto ([T]: `transcripci_n_de_entrevista_...md`, no versionado).
- `docs/revision-alcance.md`.

Lo marcado como **(hipótesis)** no está validado con usuarios.

## Problema
Los artesanos del corredor costero de Talara y Piura venden casi solo en persona: en su casa, en ferias de temporada y por referidos. No tienen un canal digital que les traiga compradores de fuera.

Les cuesta fotografiar y publicar sus productos, y costean de forma incompleta: omiten la mano de obra, los servicios y la comercialización. Al comprador externo le falta confianza para pagar a distancia y coordinar el envío.

## Usuarios
| Usuario / rol | Qué necesita hacer |
| --- | --- |
| Artesano (APK Android) | Registrar sus productos en pocos pasos, aun sin señal; calcular su precio; recibir pedidos; cobrar con su propio enlace; despachar |
| Comprador / turista (web) | Descubrir piezas y artesanos, confiar en ellos (RNA verificado), pedir con recojo o envío y pagar |
| Administrador (web) | Revisar el RNA declarado y aprobar o rechazar la acreditación |

## Cómo trabajan hoy
Según [T]; son estimaciones orales, no estadísticas.
1. Producen en casa: Daniela estima que el 90% atiende desde ahí. La mayoría trabaja a pedido y personaliza; algunos tienen stock.
2. Venden por referidos, en ferias de temporada y en visitas que organizan las agencias. En las ferias lejanas, un comité de la asociación lleva las piezas de todos.
3. Coordinan por WhatsApp estándar; casi no usan WhatsApp Business.
4. Cobran a extranjeros con tarjeta. Tras una capacitación, el 70–80% vio el cobro por link de Izipay como una solución; no se sabe cuántos lo usan.
5. Algunos envían a otras provincias por agencias de encomiendas.
6. Aprenden en capacitaciones presenciales, paso a paso.

## Objetivo del producto
Que el artesano publique una pieza desde su celular en pocos pasos, aun sin señal, y que un comprador externo la encuentre, la pida y la pague con datos de despacho estructurados.

## Alcance
- **Incluye** (detalle en `docs/plan.md`):
  - Login con Google.
  - Acreditación RNA manual.
  - Borrador sin conexión con calculadora de costos.
  - Ficha, etiquetas y hasta 4 fotos asistidas por IA, con filtro de artesanía y la foto original conservada (CC-09).
  - Vitrina pública con filtros y WhatsApp.
  - Pedido con datos de despacho.
  - Confirmación como cotización (sin reserva de stock, CC-09) y pago por enlace con verificación manual.
- **No incluye:**
  - Pasarela integrada ni comisión por venta.
  - Integración con Shalom.
  - Consulta automática del RNA.
  - Asociaciones con gestión propia y líderes.
  - Preferencias del comprador.
  - Suscripción real.
  - Exportación de productos marinos y pandero.
  - Perfiles creados a partir del padrón.

## Restricciones
- **Plazo:** hackatón de 24 h. Al cerrar el plan quedaban unas 15 h. Equipo de 5 estudiantes; el código lo implementa Cristopher.
- **Presupuesto:** planes gratuitos (Supabase Free, Vercel Hobby) y saldo de OpenRouter. No hay precios de suscripción aprobados.
- **Técnicas o legales:**
  - IA solo Gemini vía OpenRouter (restricción oficial).
  - Vercel Hobby es de uso no comercial.
  - Sin datos personales del padrón en la app.
  - Tratamiento de datos personales (Ley 29733) pendiente de revisión legal.
- **Dispositivos:**
  - Artesano: Android ≥ 7 (APK instalada directamente).
  - Comprador: navegador en celular o laptop.

## Cómo sabremos que funciona
- En una demo de menos de 3 min, sin fallos y repetible dos veces:
  - Un artesano crea un borrador en modo avión, lo sincroniza, lo procesa con IA y lo publica.
  - Un comprador lo encuentra filtrando por lugar, lo pide con envío y la orden llega a `pagada` y luego a `enviada`.
- `make verify` pasa en la versión entregada.
- **(Hipótesis, para validar después de la hackatón):**
  - Los artesanos completan un producto sin ayuda después de una capacitación presencial.
  - Los QR en los vehículos generan visitas a la vitrina.

## Preguntas abiertas
- Lista definitiva de lugares y si Punta Sal tiene artesanos.
- Datos que exige Shalom al remitente y al destinatario.
- Modelo de sostenibilidad: suscripción, patrocinio u otro. No hay disposición de pago validada.
- Consentimiento y base legal para usar datos del padrón en el futuro.
- Si APAVIT participará en la difusión de los QR.
