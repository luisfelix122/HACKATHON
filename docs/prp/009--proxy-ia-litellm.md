# PRP 009 — Proxy de IA con LiteLLM en el servidor

- Caso de uso: CU-09 (`docs/plan.md`, infraestructura de CU-03 y CU-08)
- Responsable: Cristopher (archivos) · Operador del despliegue: laptop autorizada por Johann · Revisor: Johann + subagente `reviewer`
- Estado: listo para preparar archivos (actualizado por CC-12: imprescindible, sin respaldo); **despliegue pendiente** de las decisiones de la sección Notas
- Módulo: B (`docs/modulos.md`, CC-11).
- Rama: `cu-09/proxy-ia-litellm`

## Objetivo
Entregar en `infra/litellm/` un paquete listo para que la **laptop autorizada** lo despliegue en el servidor de Johann:
- `compose.yaml`, `config.yaml`, `.env.example` y `README.md`.

Al aplicarlo, LiteLLM Proxy:
- Corre en Docker y escucha solo en `127.0.0.1:4000`.
- Se publica por el túnel existente de Cloudflare en `https://ayllu-ia.likadev.com` (subdominio confirmado).
- Exige la clave de LiteLLM en cada llamada.
- Reparte los alias `ayllu-texto`, `ayllu-audio` y `ayllu-imagen` entre las llaves configuradas (CC-12).

## Por qué
Es la decisión `0002-proxy-ia-litellm.md` (CC-02).

## Datos del servidor (informe de Johann, 2026-10-10)
| Tema | Valor |
| --- | --- |
| Sistema | Debian GNU/Linux 13.7 (Trixie); 16 GB de RAM; SSD de 480 GB en `/`, NVMe de 1 TB en `/datos` |
| Docker / Compose | 29.8.2 / plugin v5.5.1 (ya instalados; **no reinstalar**) |
| Puertos | 4000 libre; **8080 ocupado** por Filebrowser (no usar) |
| Acceso de administración | Solo por Tailscale y con permisos del propietario. La laptop autorizada hace el despliegue; **este agente no accede al servidor** |
| Cloudflare | Dominio `likadev.com`; túnel `homelab-johann-prueba` (configuración remota); conector Docker `homelab-cloudflare-prueba-cloudflared-1` |
| Ubicación (confirmada por Johann) | `/datos/trabajo/proyectos/ayllu/litellm/` |
| Disponibilidad | Encendido desde 2026-10-01. Sin UPS ni internet de respaldo confirmados. Problema de arranque sin monitor reportado |

## Criterios de aceptación
- [ ] `infra/litellm/` contiene `compose.yaml`, `config.yaml`, `.env.example` (solo nombres y valores ficticios) y `README.md`. Ningún archivo contiene secretos.
- [ ] `compose.yaml` cumple:
  - Imagen `ghcr.io/berriai/litellm` **fijada a una versión** (no `latest`).
  - `--config /app/config.yaml` y `env_file: .env`.
  - Puertos `127.0.0.1:4000:4000`.
  - `restart: unless-stopped`.
  - `healthcheck` contra el endpoint de salud del proxy (verificar la ruta en la documentación de LiteLLM al escribirlo).
  - Sin Postgres ni interfaz de administración.
- [ ] `config.yaml` define los alias `ayllu-texto`, `ayllu-audio` e `ayllu-imagen` (`gemini/gemini-2.5-flash-image`, CC-12), con una deployment por llave (`api_key: os.environ/IA_KEY_n`). `router_settings` usa `routing_strategy: simple-shuffle`, `num_retries` y cooldown ante 429.
- [ ] `README.md` documenta:
  - Requisitos.
  - Ruta elegida y permisos del `.env` (`chmod 600`).
  - `docker compose up -d`.
  - La ruta del túnel (`ayllu-ia.likadev.com` → `http://localhost:4000`).
  - La autenticación máquina a máquina.
  - La verificación con curl (sin clave → 401; con clave → 200).
  - La prueba tras reiniciar el servidor, la rotación de llaves, los logs y la retención.
- [ ] Tras el despliegue, que hace el operador y registra en `docs/traspasos/CU-09-cristopher.md`:
  - Llamada sin clave → 401.
  - Llamada con clave a `ayllu-texto` → 200.
  - Llamada con clave a `ayllu-texto` con una imagen de entrada (`image_url` con data URI base64) → 200, porque el PRP 003 envía la foto original para el filtro de artesanía (CC-09).
  - Con clave, `POST /v1/images/edits` con `model=ayllu-imagen` y una foto → 200 con `data[].b64_json` (CC-12).
  - Con clave, `ayllu-audio` con un audio de 5 s en el formato que graba el WebView (anotado en el PRP 000) → 200 con la transcripción. Si falla, anotar qué formato sí acepta (CC-12).
  - Con una llave inválida en la lista, las llamadas siguen respondiendo 200.
  - El proxy vuelve a funcionar tras un reinicio.
- [ ] Con el proxy apagado, la Edge Function responde `502 ia_no_disponible` y el artesano puede completar la ficha a mano (lo prueba el PRP 003; sin respaldo desde CC-12).

## Contexto necesario
- **Contratos:** `docs/contratos.md` §Proxy de IA y §Convenciones.
- **Decisiones:** `0002-proxy-ia-litellm.md`, `CC-02.md`.
- **Documentación externa:**
  - https://docs.litellm.ai/docs/proxy/docker_quick_start: `--config`, puerto 4000, `os.environ/...`, clave maestra, `/v1/chat/completions`.
  - https://docs.litellm.ai/docs/proxy/deploy: fijar la versión de la imagen; sin Postgres solo funciona la clave maestra; Redis solo con varias instancias.
  - https://docs.litellm.ai/docs/routing: `simple-shuffle`, `num_retries`, `allowed_fails`, `cooldown_time`.
  - https://docs.litellm.ai/docs/providers/gemini: prefijo `gemini/` (CC-12: sin OpenRouter).
  - https://docs.litellm.ai/docs/image_edits: `/v1/images/edits` con `gemini/gemini-2.5-flash-image`; respuesta solo en base64.
- **Trampas conocidas:**
  - **Cloudflare Access interactivo:** una pantalla de login rompería un cliente de API, según el informe. La autenticación obligatoria es la clave de LiteLLM (`Authorization: Bearer`). Si Johann exige Access, usar un **service token** de Cloudflare, cuyas cabeceras enviaría la Edge Function (**sin verificar**: revisar la documentación de Cloudflare Access antes).
  - **Permisos en el servidor:** no pedir acceso a los grupos `sudo` ni `docker` para colaboradores; el grupo `docker` equivale a control del host. Las operaciones privilegiadas las decide Johann.
  - **Llaves:** las escribe el propietario en el `.env` del servidor. Nunca van en git, chat ni logs.
  - **Proveedor (CC-12):** Gemini directo. Varias llaves de un mismo proyecto de Google no multiplican la cuota; usar proyectos distintos. Restricción de la hackatón resuelta: confirmado por Cristopher el 2026-10-10: usar Gemini directo no incumple la restricción de la hackatón.
  - **Puerto 8080:** está ocupado; no usarlo.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `infra/litellm/compose.yaml` | servicio `litellm` |
| crear | `infra/litellm/config.yaml` | alias, deployments y `router_settings` |
| crear | `infra/litellm/.env.example` | `LITELLM_MASTER_KEY=`, `IA_KEY_1=`, `IA_KEY_2=`, … |
| crear | `infra/litellm/README.md` | despliegue y operación para la laptop autorizada |
| crear | `docs/traspasos/CU-09-cristopher.md` | resultados del despliegue (los entrega el operador) |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Esperar las decisiones de la sección Notas (proveedor y modelos como mínimo).
2. Escribir los cuatro archivos de `infra/litellm/` y validarlos en local: `docker compose -f infra/litellm/compose.yaml config` con un `.env` de valores ficticios y Docker Desktop encendido.
3. Entregar el paquete a la laptop autorizada (vía git). Johann y el operador eligen la ruta, crean el `.env`, levantan el servicio y agregan la ruta del túnel.
4. El operador registra los resultados en el traspaso. Cristopher configura en Supabase `IA_BASE_URL`, `IA_API_KEY` e `IA_TIMEOUT_MS`.

## Validación
1. `make verify`: `prettier --check` cubre YAML.
2. `docker compose config` válido en local.
3. **Pruebas tras el despliegue:** las de los criterios, ejecutadas por el operador.

## Fuera de alcance
- Postgres, interfaz de LiteLLM, claves virtuales y seguimiento de gasto.
- Redis y más de una instancia.
- Acceso de este agente al servidor.

## Notas / riesgos
**Decisiones pendientes:**
1. **Equipo Ayllu:**
   - Cuentas o proyectos **distintos** y a qué cuenta pertenece cada llave.
   - Modelos exactos de texto y audio (imagen: `gemini-2.5-flash-image`, CC-12).
   - Presupuesto o cuota por cuenta y qué pasa cuando se agota.
2. **Johann:**
   - Autenticación: solo la clave de LiteLLM, o además un service token de Access.
   - Ruta (`/opt` o `/datos`).
   - Política de logs y respaldos.
3. **Disponibilidad:** sin UPS ni internet de respaldo confirmados. Desde CC-12 no hay respaldo: si el proxy cae, no hay IA. Revisar el servidor antes de la demo y tener el video de respaldo.
4. **Proveedor:** decidido en CC-12 (Gemini directo, sin OpenRouter).
