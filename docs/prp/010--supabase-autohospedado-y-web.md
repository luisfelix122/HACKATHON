# PRP 010 — Supabase self-hosted y web en el servidor

- Caso de uso: CU-10 (`docs/plan.md`, infraestructura de todos los CU)
- Responsable: Cristopher (archivos) · Operador del despliegue: laptop autorizada por Johann · Revisor: Johann + subagente `reviewer`
- Estado: listo para preparar archivos (actualizado por CC-09); **despliegue pendiente** de los datos de la sección Notas
- Rama: `cu-10/supabase-autohospedado`

## Objetivo
Entregar en `infra/supabase/` e `infra/web/` lo necesario para que la laptop autorizada levante en el servidor:
1. **Supabase self-hosted** v0.8.2 con Google OAuth, Email/Password con registro autoconfirmado (CC-09) y Realtime. El gateway queda en `127.0.0.1:8000`, publicado como `https://ayllu-api.likadev.com`.
2. **La web estática** (`dist-web`), servida por un contenedor ligero en `127.0.0.1:<puerto libre>` y publicada como `https://ayllu.likadev.com`, con la reescritura de la SPA.
3. **Las migraciones** de `supabase/migrations/` aplicadas, y un **respaldo** diario de Postgres en `/datos`.

## Por qué
Es la decisión `0003` (CC-05).

## Criterios de aceptación
- [ ] `infra/supabase/README.md` documenta todo el despliegue:
  - Cómo obtener `supabase/supabase` en `self-hosted/v0.8.2` con clonado disperso de `docker/`.
  - Cómo generar los secretos (`sh utils/generate-keys.sh`, `sh utils/add-new-auth-keys.sh`) y que ningún valor por defecto queda en uso.
  - Las variables de URL: `SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL=https://ayllu-api.likadev.com/auth/v1`, `SITE_URL=https://ayllu.likadev.com` y `ADDITIONAL_REDIRECT_URLS`, que debe incluir `pe.ayllu.artesano://auth**` (deep link de la APK, CC-06; el patrón con `**` cubre parámetros añadidos como `sb_flow_id`). Si no coincide, Auth redirige a `SITE_URL` y el registro en la APK falla.
- [ ] `infra/supabase/docker-compose.override.yml`:
  - Activa `GOTRUE_EXTERNAL_GOOGLE_*`, que en el `docker-compose.yml` oficial viene comentado.
  - Publica el gateway solo en `127.0.0.1:8000`.
  - Publica Postgres y el pooler solo en `127.0.0.1` (o no los publica).
- [ ] Studio **no** es accesible desde internet; solo por Tailscale.
- [ ] `infra/supabase/.env.example` lista **solo los nombres** de las variables que cambian respecto al oficial; ningún valor.
- [ ] `infra/web/`: un `compose.yaml` y la configuración del servidor estático (Caddy o nginx) que sirven `dist-web` con fallback a `index.html`, en `127.0.0.1:8090` (puerto acordado con Johann; 8080 está ocupado por Filebrowser y 4000 es de LiteLLM).
- [ ] Tras el despliegue (lo ejecuta el operador y lo registra en `docs/traspasos/CU-10-cristopher.md`):
  - `https://ayllu-api.likadev.com/rest/v1/` responde 401 sin clave.
  - La web carga y una ruta profunda no da 404.
  - El login con Google vuelve a la web.
  - `signUp` con correo y contraseña devuelve una sesión sin pedir confirmación (CC-09).
  - Un mensaje insertado en `mensaje_orden` llega a un cliente suscrito por Realtime a través de `wss://ayllu-api.likadev.com/realtime/v1` (CC-09).
  - `make test-db` pasa contra la instancia, o las pruebas pgTAP pasan en una copia local.
  - Tras reiniciar el servidor, todo vuelve a funcionar.
  - Existe un respaldo `pg_dump` fechado en `/datos`.
- [ ] El README documenta el despliegue en el servidor.

## Contexto necesario
- **Decisiones:** `0003-autohospedaje-supabase-y-web.md`, `0002-proxy-ia-litellm.md`, `CC-03`, `CC-05`, `CC-09`.
- **Datos del servidor:** PRP 009, «Datos del servidor».
- **Documentación externa (verificada el 2026-10-10):**
  - https://supabase.com/docs/guides/self-hosting/docker:
    - Requisitos: 4 GB de RAM, 2 CPU y 40 GB mínimo.
    - Gateway en el puerto 8000.
    - Secretos que deben cambiarse.
    - `SUPABASE_PUBLIC_URL`, `API_EXTERNAL_URL` y `SITE_URL`.
    - Se recomienda HTTPS con un proxy inverso.
  - https://supabase.com/docs/guides/self-hosting/self-hosted-oauth:
    - `GOOGLE_ENABLED`, `GOOGLE_CLIENT_ID` y `GOOGLE_SECRET`.
    - `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI: ${API_EXTERNAL_URL}/callback`.
    - En Google se registra `https://<dominio>/auth/v1/callback`.
    - «HTTPS is required by most OAuth providers».
- **Copia local de referencia:** `C:\dev\supabase-selfhost\docker` (clonado disperso, commit `564eab8`). En `docker-compose.yml` hay dos tramos relevantes:
  - Líneas 180–183: Google comentado.
  - Línea 535: Postgres publicado en `${POSTGRES_PORT}:5432`.
- **Trampas conocidas:**
  - **Valores por defecto:** el `.env.example` oficial trae secretos de ejemplo y la guía dice «never start your self-hosted Supabase using these defaults».
  - **Postgres expuesto:** el `docker-compose.yml` oficial publica Postgres en todas las interfaces. El override debe limitarlo a `127.0.0.1`.
  - **Autoconfirmación (CC-09):** `ENABLE_EMAIL_SIGNUP=true`, `ENABLE_EMAIL_AUTOCONFIRM=true` y `DISABLE_SIGNUP=false`, porque el artesano puede registrarse con correo y contraseña sin Google y no hay SMTP. Riesgo aceptado para la hackatón: un tercero podría registrarse primero con el correo de otra persona (ver CC-09). Probar también el registro con Google y luego `updateUser({ password })`.
  - **Realtime por el túnel:** Cloudflare Tunnel debe dejar pasar WebSocket hacia `/realtime/v1`; comprobarlo con un cliente suscrito.
  - **SMTP:** sin SMTP no hay correos. Este flujo no los necesita; comprobarlo.
  - **Permisos de Docker:** no pedir acceso a los grupos `docker` ni `sudo` para colaboradores (informe de Johann).
  - **Secretos:** los escribe el operador o Johann en el servidor. Nunca van en git, chat ni logs.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `infra/supabase/README.md` | despliegue, secretos, URLs, migraciones, respaldo y reinicio |
| crear | `infra/supabase/docker-compose.override.yml` | Google, puertos solo en loopback |
| crear | `infra/supabase/.env.example` | solo los nombres que cambian |
| crear | `infra/supabase/respaldo.sh` | `pg_dump` fechado hacia `/datos/...`, con rotación |
| crear | `infra/web/compose.yaml`, `infra/web/Caddyfile` (o `nginx.conf`) | servir `dist-web` con fallback a la SPA |
| modificar | `README.md` | despliegue en el servidor |
| crear | `docs/traspasos/CU-10-cristopher.md` | resultados (los entrega el operador) |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Recibir los datos de la sección Notas.
2. Escribir los archivos de `infra/supabase/` e `infra/web/`. Validarlos en local con `docker compose config` (Docker Desktop encendido).
3. **Operador:**
   1. Clonar `supabase/supabase` (v0.8.2, solo `docker/`) en `/datos/trabajo/proyectos/ayllu/supabase/` y copiar el override. La web va en `/datos/trabajo/proyectos/ayllu/web/` y los respaldos en `/datos/trabajo/proyectos/ayllu/respaldos/`.
   2. Generar los secretos y llenar el `.env`.
   3. `docker compose pull` y `docker compose up -d`.
4. **Operador:** agregar al túnel `ayllu-api` → `http://localhost:8000` y `ayllu` → `http://localhost:8090`.
5. **Operador:** aplicar las migraciones (`npx supabase db push --db-url ...` por Tailscale); activar Google y registrar la URI de callback en Google Cloud.
6. Compilar la web y la APK con `VITE_SUPABASE_URL=https://ayllu-api.likadev.com`. Publicar `dist-web`.
7. Ejecutar las pruebas de los criterios y programar el respaldo.

## Validación
1. `make verify` (`prettier --check` cubre YAML).
2. `docker compose config` válido en local.
3. **Pruebas tras el despliegue:** las de los criterios, ejecutadas por el operador.

## Fuera de alcance
- Alta disponibilidad, réplicas y monitoreo externo.
- SMTP y correos de Auth.
- Logs centralizados (Logflare/Vector).

## Notas / riesgos
**Datos pendientes:**
1. **Johann:**
   - Subdominios (`ayllu-api`, `ayllu`) y ruta (`/datos/trabajo/proyectos/ayllu/`): **confirmados** el 2026-10-10.
   - Quién opera la laptop autorizada.
2. **Equipo:** Client ID y Secret de Google OAuth (los escribe el operador en el `.env` del servidor).
3. **RAM:** Supabase recomienda 8 GB; el servidor tiene 16 GB compartidos con LiteLLM, Filebrowser y otros servicios. Revisar el consumo tras el arranque.
