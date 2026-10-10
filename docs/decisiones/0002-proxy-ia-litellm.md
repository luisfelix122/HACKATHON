# 0002 — Proxy de IA con LiteLLM en servidor propio

- Fecha: 2026-10-10
- Estado: aceptada
- Decide: Cristopher (equipo) · Consultados: dueño del servidor (pendiente de respuesta)

## Contexto
El equipo quiere balancear la carga y tener respaldo entre varias llaves de IA, para no quedarse sin servicio por límites de uso (429). Hay que tener en cuenta dos hechos:
- **Varias llaves de una misma cuenta de OpenRouter no suben el límite.** OpenRouter dice: "Making additional accounts or API keys will not affect your rate limits, as we govern capacity globally" (https://openrouter.ai/docs/api-reference/limits).
- **El stack (0001) no tiene servidor propio.** La IA se llama desde una Edge Function de Supabase.

Hay disponible un servidor Linux personal (16 GB de RAM y 500 GB de SSD). Se administra por Tailscale y el dueño tiene un dominio en Cloudflare con túneles.

## Alternativas
| Opción | A favor | En contra |
| --- | --- | --- |
| **LiteLLM Proxy en el servidor, con OpenRouter directo como respaldo** | Estándar abierto con varias llaves por modelo, `simple-shuffle`, fallbacks, reintentos y cooldown ante 429. Se cambia de proveedor sin tocar el código. | Otro componente que operar. Depende de que una computadora doméstica esté encendida y con internet. |
| Arreglo de llaves dentro de la Edge Function | Sin infraestructura nueva. | Hay que programar a mano el reparto, el cooldown y los reintentos. Es menos flexible. |
| Una sola llave de OpenRouter con el modelo de pago | Lo más simple. Sin tope de solicitudes de la plataforma para los modelos de pago. | No cumple el requisito del equipo de usar varias llaves. |

## Decisión
- Se despliega **LiteLLM Proxy** (Docker, sin base de datos, autenticado con la clave maestra) en el servidor y se expone por **Cloudflare Tunnel** en un subdominio HTTPS.
- La administración del servidor se hace solo por Tailscale y con permisos del propietario (Johann). El despliegue lo ejecuta una **laptop autorizada**, a partir de los archivos de `infra/litellm/` del repositorio. Este agente no accede al servidor.
- **Servidor:** Debian 13.7, Docker 29.8.2 y Compose v5.5.1, ya instalados. Se usa el túnel existente `homelab-johann-prueba` del dominio `likadev.com`. Subdominio confirmado: `ayllu-ia.likadev.com` (CC-07). Detalle en el PRP 009.
- La Edge Function llama al proxy a través de `IA_BASE_URL`, en formato compatible con OpenAI (`/v1/chat/completions`). Si el proxy no responde dentro de `IA_TIMEOUT_MS` o devuelve un 5xx, llama **directo a OpenRouter** con `OPENROUTER_API_KEY`.
- La **mejora de foto** va directo a OpenRouter (`/api/v1/images`): no está verificado que LiteLLM soporte `gemini-2.5-flash-image`.
- El proxy publica **alias de modelo** propios. El código usa solo esos alias y nunca nombres de proveedor.

## Motivo
LiteLLM implementa de forma estándar el balanceo entre llaves y la conmutación por error que pide el equipo (https://docs.litellm.ai/docs/routing). El respaldo directo a OpenRouter evita que la demo dependa de una sola computadora.

## Consecuencias
- **Positivas:**
  - Rotación y respaldo entre llaves sin programarlos.
  - Se puede cambiar el modelo o el proveedor editando `config.yaml`.
  - El código del producto no conoce las llaves.
- **Negativas / costos:**
  - Disponibilidad atada al servidor doméstico (luz, internet, reinicios).
  - Otro secreto que gestionar (`LITELLM_MASTER_KEY`).
  - Sin base de datos no hay seguimiento de gasto por clave.
  - **Pendiente de confirmar con los organizadores:** si las llaves son de Gemini directo, la IA deja de pasar por OpenRouter, que es la restricción oficial.
- **Qué cambia en otros documentos:**
  - `docs/cambios/CC-02.md`.
  - `docs/plan.md`.
  - `docs/contratos.md` (variables y proxy).
  - PRP 003 y el nuevo PRP 009.
