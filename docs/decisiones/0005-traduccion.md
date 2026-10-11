# 0005 — Traducción para turistas sin gastar tokens en la interfaz

- Fecha: 2026-10-10
- Estado: aceptada (CC-10)
- Decide: Cristopher, a partir de la propuesta de Luis

## Contexto
Lobitos y Máncora reciben turistas extranjeros. Hay dos cosas que traducir: la interfaz y las fichas de la vitrina, y los mensajes del hilo de la orden (PRP 008, opcional). Los tokens de Gemini se reservan para tareas que necesitan razonamiento: evaluar la pieza, armar la ficha, generar fotos.

## Alternativas
| Opción | A favor | En contra |
| --- | --- | --- |
| **Traducción nativa del navegador** (`<html lang="es">`) | Costo cero y sin código: Chrome y Safari ofrecen traducir la página (botones, fichas y descripciones) con un toque | La calidad depende del navegador; no se controla cada palabra |
| `react-i18next` con `es.json`, `en.json`, `fr.json` | Control exacto de la interfaz | Mantener y traducir a mano cada archivo; no traduce las fichas, que son contenido |
| LibreTranslate en Docker en el servidor | Sin costo por token para el hilo | Otro contenedor (descarga de modelos, RAM del servidor), menor calidad con español coloquial; el PRP 008 es opcional |
| Gemini bajo demanda con caché (PRP 008) | Buena calidad; cada mensaje se traduce una sola vez y queda en `texto_traducido[idioma]` | Gasta tokens, aunque pocos |

## Decisión
- **Interfaz y vitrina:** traducción nativa del navegador. La web declara `<html lang="es">` y no bloquea la traducción; solo la marca «Ayllu» lleva `translate="no"`. Sin `react-i18next`.
- **Hilo de la orden (PRP 008, opcional):** Gemini bajo demanda, al abrir el hilo, con caché en la base. LibreTranslate queda como alternativa si el costo de tokens resulta un problema; no se instala en la hackatón.

## Consecuencias
- El PRP 000 crea `index.html` con `lang="es"` y el PRP 004 comprueba que la vitrina se puede traducir con el navegador.
- No hay archivos de idiomas que mantener.
