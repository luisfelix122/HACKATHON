# PRP 008 — Traducción del hilo de la orden (opcional)

- Caso de uso: CU-08 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: borrador. Módulo C. Ejecutar solo si los PRP 000–007 están completos antes de la hora 12, y después de que el PRP 003 (módulo A) esté en `main`: usa `supabase/functions/_compartido/ia.ts` sin modificarlo (CC-11).
- Rama: `cu-08/traduccion-hilo`

## Objetivo
En el hilo de una orden, cada mensaje escrito en otro idioma se muestra traducido al idioma del navegador o del dispositivo de quien lo lee, con la etiqueta «Traducción automática» y el botón «Ver original». Si la traducción falla, se muestra el original.

## Por qué
Atiende a los compradores extranjeros (Lobitos recibe turismo receptivo según [T]) sin arriesgar los acuerdos. El total, la fecha y el envío ya viven en campos estructurados (regla 12).

## Criterios de aceptación
- [ ] `traducir-mensaje` cumple su contrato y guarda la traducción en `texto_traducido[idioma]`. Una segunda lectura no vuelve a llamar a la IA.
- [ ] Solo las partes de la orden pueden pedir la traducción (`403 no_es_parte`).
- [ ] Si el idioma del mensaje coincide con el del lector, no se traduce.
- [ ] Si la función devuelve un error, el mensaje original se muestra sin bloquear el hilo.
- [ ] Siempre está disponible «Ver original».
- [ ] La interfaz no promete idiomas concretos. Si se prueba alguno, se anota cuál en Notas.

## Contexto necesario
- **Dominio:** Mensaje de la orden; regla 13.
- **Contratos:** `docs/contratos.md` §Traducir mensaje, §`mensaje_orden`.
- **Decisiones:** `revision-alcance.md` §5 (traducción de acuerdos); `0005-traduccion.md` (la interfaz y la vitrina las traduce el navegador; el hilo, Gemini bajo demanda con caché; LibreTranslate queda como alternativa).
- **Código existente a imitar:** `supabase/functions/_compartido/ia.ts` (cliente con proxy y sin respaldo, PRP 003 y CC-12) y su manejo de errores; `src/pedidos/HiloMensajes.tsx`.
- **Documentación externa:** https://docs.litellm.ai/docs/providers/gemini (chat completions por el proxy; sin OpenRouter desde CC-12).
- **Trampas conocidas:**
  - **Detección del idioma:** la hace el modelo y puede fallar. Mostrar la traducción solo si el texto devuelto es distinto del original.
  - **Costo:** traducir solo al abrir el hilo, nunca en segundo plano.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/functions/traducir-mensaje/index.ts` | handler: verifica que el llamante es parte de la orden, consulta la caché, traduce y guarda |
| crear | `supabase/functions/traducir-mensaje/traduccion.ts`, `supabase/functions/traducir-mensaje/traduccion.test.ts` | prompt y lectura de la respuesta (sin APIs de Deno) |
| crear | `src/pedidos/MensajeTraducido.tsx` | traducción, etiqueta, «Ver original» y respaldo al original |
| modificar | `src/pedidos/HiloMensajes.tsx` | usar `MensajeTraducido` |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. `traduccion.ts` con sus pruebas.
2. `index.ts`; desplegar.
3. `MensajeTraducido` e integración en el hilo.

## Validación
1. `make verify`.
2. **Pruebas a crear:**
   - Respuesta válida.
   - Respuesta vacía, que debe tratarse como error.
   - Texto devuelto igual al original, que no debe mostrarse como traducción.
3. **Prueba manual:**
   - El comprador escribe en inglés → el artesano lo ve en español con «Ver original».
   - Con la clave inválida → se ve el original.

## Fuera de alcance
- Traducción de la vitrina y de las fichas: la hace el navegador (decisión 0005).
- Selector manual de idioma.

## Notas / riesgos
- Idiomas probados: <pendiente>.
