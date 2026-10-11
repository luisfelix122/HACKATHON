# CosteARTE — Revisión de alcance previa a los PRP

## Contexto
Quedan 15 h. Hay cinco estudiantes y aún no se eligió stack. Ya está elegido el reto 17. Este documento revisa el alcance preliminar contra la evidencia del repositorio:
- `transcripci_n_de_entrevista_a_especialista_en_turismo_y_artesan_a.md`, citado como **[T]**.
- `reporte_de_entrevista_y_diagn_stico.md`, citado como **[R]**.
- `encabezados_de_encuesta.md`, citado como **[P]**.

El objetivo es fijar un MVP demostrable antes de redactar los PRP. Aquí no se escribe código ni se elige stack.

> **Actualizado por `docs/cambios/CC-01.md`:** el comprador usa la web y el artesano una APK de Android (Capacitor). Lo que sigue sobre la PWA vale ahora solo para la web del comprador.

**Restricción de plataforma (equipo, original):** aplicación **web instalable como PWA**, usable en laptop y en celular con una sola base de código y diseño adaptable. Lo que implica:
- El modo sin conexión depende del service worker y del almacenamiento del navegador.
- La cámara y el micrófono se usan mediante las APIs del navegador.
- Requiere HTTPS en el despliegue de la demo.

> El repositorio **no contiene** la transcripción de preguntas a mentores. Lo atribuido a mentores se toma de su mensaje y no pude contrastarlo.

---

## 1. Hechos, decisiones, hipótesis y pendientes

### 1.1 Hechos de entrevista (fuente: Daniela, [T])
- Venden por referidos, en ferias de temporada y mediante visitas organizadas por agencias.
- "Todo el 90% lo hace en sus casas". Es una estimación oral.
- Se agrupan en asociaciones de 15 a 30 integrantes. En ferias viaja un comité o un presidente con las piezas de todos.
- La mayoría trabaja a pedido y personaliza. Algunos tienen stock.
- Cabo Blanco no tiene señal. Allí un hotel capacita y vende.
- Costean de forma incompleta. Ejemplo citado: S/15 de hilo para una blusa vendida a S/20.
- Usan mucho WhatsApp y casi no usan WhatsApp Business.
- Respecto de Izipay, el 70–80% de las capacitadas "lo vieron como una solución magnífica". **[R] lo convierte en "lo adoptó rápidamente", y esa conclusión no tiene respaldo en [T].**
- "Algunos sí realizan ya envíos". La empresa de envíos, Shalom, aparece en la pregunta del entrevistador, no en la respuesta de Daniela.
- El RNA es requisito para pertenecer a una asociación. Daniela también lo pide para unirse a la plataforma: "tiene que estar registrado".
- Aprenden en capacitaciones presenciales, paso a paso. Los videos y tutoriales no les sirven.
- Su principal preocupación es atraer compradores y artesanos de forma sostenida.
- PromPerú se orienta a piezas de alto costo.

### 1.2 Discrepancias entre [R] y [T] que hay que corregir antes de citar
| Tema | [R] dice | [T] dice |
| --- | --- | --- |
| Gremio de agencias | "NAPAVID" | APAVIT ("se podría") |
| Izipay | "70–80% lo adoptó" | "lo vieron como solución" |
| Comisión | "se contempla comisión mínima" | la propone un entrevistador; Daniela responde "Ajá, exacto" y vuelve a preguntar cómo atraer compradores. **No hay compromiso.** |
| Padrón | incluye "rubro" y "ubicación" | [P] no tiene rubro, distrito ni teléfono |
| Punta Sal | — | se menciona como destino turístico, no como zona de artesanos |

### 1.3 Afirmaciones de su mensaje que no encuentro en [T]
- "El artesano publica, gestiona stock, fabricación y envío".
- "Exportación de productos marinos y pandero quedan fuera". Daniela solo menciona la permisología de productos marinos y el pandero le pareció interesante.
- "Sin RNA no se publica; la plataforma orienta".

Pueden venir de la conversación con mentores. Les recomiendo anotar su origen.

### 1.4 Decisiones del equipo
Son las listadas en su mensaje: Google, revisión manual del RNA, borrador offline, flujo de pedido, pago por enlace con verificación manual, reserva de 24 h y suscripción simulada. **Ninguna está validada con usuarios.**

### 1.5 Hipótesis (no presentarlas como hechos)
- Los artesanos aceptarán iniciar sesión con Google.
- Grabar audio les resultará más fácil que escribir.
- El comprador extranjero usará chat traducido.
- Los turistas escanearán el QR después del viaje.
- Existe disposición a pagar una suscripción.
- Los cinco supuestos de su mensaje.

### 1.6 Pendientes
- Cómo se introduce la ganancia: monto o porcentaje.
- Las fotos de campo y la "base estructurada" del enunciado, que no llegaron.
- El consentimiento para usar datos.
- Precios.
- La cobertura de idiomas.
- La confirmación de APAVIT.

---

## 2. Coherencia y viabilidad: conservar, simplificar o posponer

**Incoherencia central:** el pago va directo al Izipay del artesano y la plataforma no forma parte de ese flujo. Por eso **no puede cobrar comisión por venta** sin una integración de pagos (marketplace o split), que nadie ha verificado. Esto refuerza la suscripción, o la mediación de una entidad aliada, como vía de ingresos.

| Función | Recomendación | Impacto |
| --- | --- | --- |
| Google para ambos roles | **Conservar** | Evita gestionar contraseñas. Riesgo: configurar OAuth cuesta alrededor de 1 h. Preparar cuentas de prueba para la demo. |
| Aprobación manual del RNA | **Conservar, simplificado** | Pantalla de administración con un número de RNA declarado y un botón Aprobar/Rechazar. Sin consulta automática. |
| Borrador offline (nombre, foto, audio, calculadora) | **Conservar** | Es el diferenciador frente al problema de Cabo Blanco y a PromPerú. Sincronizar con un botón visible, sin fusión de conflictos (un borrador = un dispositivo). |
| IA para la foto (luz y fondo) | **Simplificar** | Mostrar la original y la mejorada lado a lado. **La original queda por defecto** y el artesano elige. Si falla, la original sigue sirviendo. |
| Audio → transcripción → ficha | **Conservar** | Es el núcleo del criterio 2. El artesano edita los campos antes de publicar. |
| Calculadora | **Conservar** | Supuesto: ganancia como **monto en soles**, que es más simple que un porcentaje. El precio final lo decide el artesano. |
| Disponibilidad stock / a pedido | **Conservar** | Son dos opciones y un campo. |
| Catálogo público con búsqueda y filtros (playa y tipo) | **Conservar** | Criterio 3. |
| Filtro por asociación | **Simplificar** | La asociación es un dato precargado del artesano. Sin interfaz para crear asociaciones. |
| Asociaciones y líderes con permisos | **Posponer** | No aparece en ningún paso de la demo y añade roles y permisos. |
| Perfil del artesano con valor cultural y botón de WhatsApp | **Conservar** | Responde a la "acreditación" y a la confianza. |
| Preferencias y priorización por afinidad | **Posponer** | Sin datos no se nota en la demo. Ahorra un formulario y la lógica de ranking. |
| Chat interno con traducción | **Simplificar a hilo de mensajes dentro de la orden**, traducido con "Ver original" | Un chat libre es caro y genera riesgo legal (sección 5). El hilo de la orden cubre el flujo de "necesita orientación". Para el contacto previo al pedido, el WhatsApp del perfil. Si no alcanza el tiempo, el hilo queda sin traducir y el pitch lo presenta como siguiente paso. |
| Pedido (recojo o envío) con datos de Shalom | **Conservar** | Criterio 4. Formulario guiado con los datos de despacho y sin integración con Shalom, porque no verifiqué ninguna API pública. |
| Estados de la orden y enlace de pago pegado por el vendedor | **Conservar** | Izipay permite links individuales "sin integraciones" (ver fuentes). Verificación manual mediante el botón "Confirmé el abono". |
| Reserva de stock y vencimiento a las 24 h | **Simplificar** | Calcular el vencimiento al leer la orden (`vence_en` < ahora). Sin trabajos programados. |
| Reintento automático de la IA | **Simplificar** | Reintentar al recuperar la conexión, más un botón "Reintentar". |
| Suscripción | **Posponer** (máximo, una pantalla estática) | No sale en el pitch y no tiene precio validado. |

**Capacidad:** 5 personas × ~12 h efectivas ≈ 60 h-persona. Las 7 unidades de la sección 6 caben si el stack queda fijado en la primera hora y el 25% final se reserva para integrar, cargar datos semilla y ensayar.

---

## 3. Recorrido de demo (≈2:30)

| t | Escena | Real | Simulado |
| --- | --- | --- | --- |
| 0:00 | Un turista escanea el QR de la van y entra al catálogo sin cuenta. Filtra por "Lobitos". | Catálogo, filtros | QR impreso que apunta a la URL desplegada |
| 0:25 | Abre el poncho-toalla y ve la ficha, la historia del artesano, el sello "RNA verificado" y el botón de WhatsApp. | Ficha, perfil, sello del flujo de aprobación | Artesano y producto **ficticios** de la semilla |
| 0:45 | En el celular del artesano, **modo avión**: nombre, foto, audio de 10 s y calculadora. Guarda el borrador. | Captura offline | — |
| 1:10 | Activa la red y sincroniza. La IA transcribe, genera la ficha y propone la foto mejorada junto a la original. El artesano corrige el precio y publica. | IA vía el proxy LiteLLM con Gemini (CC-12) | **Respaldo grabado** si falla la red del local |
| 1:40 | El comprador inicia sesión con Google y pulsa "Pedir" con envío. Llena los datos de Shalom y se crea la orden. | Login, orden | — |
| 2:00 | El vendedor acepta (se reserva el stock), suma el costo del envío y pega el enlace de pago. El comprador lo abre. | Estados, reserva | **Enlace de pago de prueba**: no se paga en vivo |
| 2:20 | El vendedor marca "Abono verificado" y luego "Enviado", con el número de guía. | Estados | Número de guía ficticio |

Reglas de la demo:
- Dos dispositivos con sesión iniciada de antemano.
- Datos semilla fijos.
- Video de respaldo de toda la secuencia.
- Ningún dato del padrón en pantalla.

---

## 4. Autosostenibilidad (sin cifras inventadas)

| Rubro | Qué lo genera | Cómo acotarlo |
| --- | --- | --- |
| Fijos | Hosting, base de datos, almacenamiento de fotos, dominio | Planes gratuitos o de bajo costo mientras haya poco volumen. Hay que cotizarlos al fijar el stack. |
| Variables | Llamadas de IA por producto (foto, audio, ficha) y por mensaje traducido | Limitar las llamadas de IA por producto o por mes. Traducir la ficha **una vez al publicarla**, no en cada visita. |
| Comisión de pago | Izipay publica 3,44% + IGV por transacción con link ([fuente](https://www.izipay.pe/link-de-pago/)) | La paga el artesano, no la plataforma. |
| Soporte | Capacitación presencial, que es el canal que funciona según [T]; aprobación del RNA; moderación | **Es el costo mayor y el menos visible.** Hoy lo subvenciona una ONG. Proponer que los líderes de asociación sean multiplicadores. |
| Captación | QR en vehículos de La Vaca Loca (comprometido); APAVIT (posible); hoteles | Medir los escaneos por QR, usando un parámetro de origen en la URL, para tener la primera evidencia de demanda. |

**Ingresos posibles:**
- Suscripción por artesano o asociación (pendiente de validar).
- Comisión, que **no es viable técnicamente** con el pago directo (sección 2).
- Patrocinio de agencias, ONG o municipios. Es una hipótesis.

Fórmula para el pitch, **ilustrativa**: punto de equilibrio = (fijos + soporte) / (cuota − costo variable por suscriptor). Presentarla sin números reales.

---

## 5. Exclusiones y riesgos

**Exclusiones del MVP:**
- Exportación de productos marinos.
- Pandero.
- Consulta automática del RNA.
- Integración con Shalom.
- Pasarela de pago integrada.
- Comisión por venta.
- Suscripción real.
- Asociaciones y líderes.
- Preferencias.
- Derechos de autor y autenticidad.
- Perfiles creados a partir del padrón.

| Riesgo | Concreto | Mitigación |
| --- | --- | --- |
| Fidelidad de la foto | Un modelo generativo de imágenes (por ejemplo `google/gemini-2.5-flash-image`) regenera píxeles y puede cambiar color, puntadas o forma. El comprador recibe algo distinto y el artesano pierde confianza. | La original queda por defecto, la comparación es visible y la mejorada solo se usa si el artesano la acepta. Mostrar siempre la original en la ficha. Prompt restrictivo, que reduce el riesgo pero no lo elimina. |
| Traducción de acuerdos | Un error en talla, plazo o precio crea una disputa y no hay registro del original. | Guardar el original, mostrar "Ver original" y marcar "Traducción automática". **El total, el plazo y el envío viven en campos estructurados de la orden, no en el texto traducido.** |
| Sincronización | Dos dispositivos, audio largo, almacenamiento lleno o un borrador perdido al limpiar el navegador. | Un borrador por dispositivo, límite de duración del audio, estado visible ("pendiente / sincronizado / error") y nunca borrar el borrador local hasta confirmar el guardado en el servidor. |
| Stock | Doble venta mientras dos órdenes esperan pago, o una reserva vencida que se paga igual. | Reservar al aceptar y vencer a las 24 h tras enviar el enlace. Si llega un pago después del vencimiento, revisión manual (supuesto pendiente). |
| Pago manual | Captura falsa, link reutilizado o abono no conciliado. | Solo el vendedor confirma, tras revisar su panel de Izipay. Usar link **individual** por orden. No aceptar capturas como prueba. |
| Datos personales | El padrón tiene datos sensibles (ingresos, estado civil). [T] contiene el teléfono de Daniela y los tres `.md` no están rastreados por git. | No cargar el padrón en la app. Decidir antes de commitear los `.md`. Revisar la Ley 29733 y su reglamento: **pendiente de verificación legal.** |
| PWA en celulares reales | Los navegadores difieren en el formato de grabación de audio, el permiso de cámara y micrófono, y pueden borrar el almacenamiento local de una PWA poco usada. El inicio de sesión con Google dentro de una PWA instalada puede comportarse distinto que en una pestaña. | Probar en la hora 2 en un Android y un iPhone del equipo: grabar, recargar sin conexión, iniciar sesión. Enviar el audio en un formato que acepte Gemini (sección 7; CC-12). Botón de sincronización visible. |
| Demo | Red del local, cuota de Gemini y servidor del proxy (CC-12), OAuth. | Video de respaldo, llaves de Gemini de proyectos distintos, cuentas de prueba. |

---

## 6. División propuesta de PRP

Antes de los PRP: `docs/decisiones/0001-stack.md` y completar `docs/plan.md`. Responsable a definir, en la primera hora.

| PRP | CU | Alcance | Depende de | Criterios de aceptación (resumen) |
| --- | --- | --- | --- | --- |
| 000 | Base PWA | Shell instalable, manifiesto, service worker, diseño adaptable laptop/celular, despliegue HTTPS | 0001 | Se instala en Android y escritorio. Abre sin conexión mostrando la pantalla de borradores. La vista se adapta de 360 px a 1440 px. |
| 001 | CU-01 Acceso y acreditación | Google, roles comprador/artesano/admin, solicitud con RNA declarado, aprobación manual | 0001 | Sin aprobación no se puede publicar pero sí guardar borradores. El administrador aprueba y aparece el sello. |
| 002 | CU-02 Borrador offline | Nombre, foto (cámara o adjunto), audio, calculadora, disponibilidad, guardado local, sincronización | 000, 001 (identidad) | En modo avión se crea y se reabre el borrador. Al sincronizar llega completo al servidor. La calculadora suma materiales + horas × tarifa + gastos + ganancia, y el precio final se puede editar. |
| 003 | CU-03 Procesamiento IA y publicación | Transcripción, ficha estructurada, mejora de foto opcional, revisión, reintento | 002 | Si la IA falla, el borrador se mantiene y se puede editar a mano. La foto original siempre está disponible. Sin aprobación del RNA no se publica. |
| 004 | CU-04 Vitrina pública | Catálogo sin cuenta, búsqueda, filtros por playa, tipo y asociación, ficha, perfil, WhatsApp | 003 (o datos semilla) | Es accesible sin login. Los filtros combinados funcionan. El perfil muestra el sello y el enlace de WhatsApp. |
| 005 | CU-05 Pedido y despacho | "Pedir", recojo o envío, formulario de datos de Shalom, orden visible para ambos, hilo de mensajes de la orden | 001, 004 | La orden se crea con datos obligatorios validados y el vendedor la ve. Los datos de envío quedan en campos estructurados. |
| 006 | CU-06 Confirmación, pago y reserva | Aceptar/rechazar, total con envío, enlace pegado, vencimiento a las 24 h, "abono verificado", enviado/entregado | 005 | Aceptar reserva el stock. Una reserva vencida libera el stock. Solo el vendedor confirma el pago. Las transiciones inválidas se rechazan. |
| 007 | CU-07 Datos semilla y guion de demo | Artesanos y productos ficticios, `docs/entrega/demo.md`, video de respaldo | 004–006 | La demo corre completa en menos de 3 min dos veces seguidas. |
| (opcional) 008 | Traducción del hilo de la orden | "Ver original" y respaldo al original | 005 | Si la traducción falla, se muestra el original. |

Paralelismo sugerido, una persona por línea tras 0001:
- 000 → 001 → 006
- 002
- 003
- 004 → 007
- 005

Los PRP 002 y 003 comparten la entidad **Borrador/Producto**, que debe fijarse primero en `docs/contratos.md`.

---

## 7. Fuentes externas
- Izipay, link de pago: https://www.izipay.pe/link-de-pago/ — **verificado**. Admite tarjetas extranjeras, Yape y Plin; link general o individual; 3,44% + IGV; abono al día hábil siguiente; "no requiere integraciones". La página no menciona API ni webhook.
- OpenRouter, entrada de audio: https://openrouter.ai/docs/features/multimodal/audio — **verificado** (histórico; no aplica desde CC-12). Audio en base64; wav, mp3, m4a, ogg y otros; ejemplo con `google/gemini-2.5-flash`.
- OpenRouter, imágenes: https://openrouter.ai/docs/features/multimodal/image-generation — **verificado** (histórico; no aplica desde CC-12). `POST /api/v1/images` con `input_references` para editar; ejemplo con `google/gemini-2.5-flash-image`.
- RNA en gob.pe: https://www.gob.pe/747-inscribirse-en-el-registro-nacional-del-artesano-rna — **no verificado**. El sitio devolvió "Acceso restringido" (HTTP 418) desde aquí.
- Noticia de MINCETUR: https://www.gob.pe/institucion/mincetur/noticias/1160976-... — **no verificado**, por el mismo bloqueo. Conviene que alguien del equipo abra ambos enlaces desde su navegador antes de citarlos.
- Shalom: no consulté ninguna fuente. No asumir que tiene API.

## Verificación de esta revisión
- El equipo contrasta las secciones 1.2 y 1.3 con la transcripción de mentores.
- Aprobar o ajustar la sección 2, en especial el cambio de chat a hilo de la orden y la ganancia como monto en soles.
- Tras la aprobación: redactar `0001-stack`, `docs/plan.md` y los PRP 001–007 con `prp-manager`.
