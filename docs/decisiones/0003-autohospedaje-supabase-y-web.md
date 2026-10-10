# 0003 — Supabase self-hosted y web en el servidor propio

- Fecha: 2026-10-10
- Estado: aceptada (reemplaza en parte a 0001: Supabase Cloud → self-hosted; Vercel → servidor propio)
- Decide: Cristopher (equipo) · Consultados: Johann (dueño del servidor; confirmó subdominios y ruta el 2026-10-10)

## Contexto
El equipo decidió usar el servidor de Johann para alojar Supabase y la web. Ese servidor ya tiene Docker y Cloudflare Tunnel, y ya alojará el proxy LiteLLM (0002). Datos del servidor en el PRP 009: Debian 13.7, 16 GB de RAM, Docker 29.8.2, Compose v5.5.1, túnel `homelab-johann-prueba` y dominio `likadev.com`. El despliegue lo hace una laptop autorizada.

## Alternativas
| Opción | A favor | En contra |
| --- | --- | --- |
| **Supabase self-hosted con Docker en el servidor, y la web como sitio estático detrás del mismo túnel** | Sin límites ni pausas de un plan gratuito; datos en infraestructura propia; un solo lugar de operación con LiteLLM | Operar Postgres, Auth, Storage y los respaldos queda a cargo del equipo; la disponibilidad depende de una computadora doméstica; más secretos que gestionar |
| Supabase Cloud (Free) + Vercel (0001) | Cero operación | Pausa tras 1 semana de inactividad; Vercel Hobby es de uso no comercial |

## Decisión
- **Supabase self-hosted**, versión fijada en `self-hosted/v0.8.2` (commit `564eab8` del repositorio `supabase/supabase`, carpeta `docker/`). Corre con Docker Compose en el servidor.
- **Publicación por Cloudflare Tunnel** (subdominios **confirmados** el 2026-10-10; Johann permite cualquier nombre en `likadev.com`):
  - API (gateway, puerto 8000): `ayllu-api.likadev.com`
  - Web estática (`dist-web`): `ayllu.likadev.com`
  - Proxy de IA: `ayllu-ia.likadev.com` (PRP 009)
- **Studio, Postgres (5432) y el pooler** solo escuchan en `127.0.0.1` y se administran por Tailscale. Nunca se publican.
- **Google OAuth** se activa con las variables `GOOGLE_*` del `.env` y las líneas `GOTRUE_EXTERNAL_GOOGLE_*`, que vienen comentadas en `docker-compose.yml`, mediante un archivo de override propio. En Google se registra `https://ayllu-api.likadev.com/auth/v1/callback`.
- **Migraciones:** las aplica la laptop autorizada contra la base, por Tailscale, con `npx supabase db push --db-url <postgres por Tailscale>`.
- **Edge Functions:** el contenedor `functions` (Edge Runtime) incluido en el stack.
- **APK:** apunta a `VITE_SUPABASE_URL=https://ayllu-api.likadev.com`.

## Motivo
Lo decidió el equipo. Además, quita la pausa por inactividad del plan Free y la restricción no comercial de Vercel, y aprovecha un servidor que ya tiene túnel y Docker.

## Consecuencias
- **Positivas:**
  - Sin cuotas de plataforma.
  - Datos bajo control del equipo.
  - Mismo túnel para la API, la web y la IA.
- **Negativas / costos:**
  - Requisitos oficiales: mínimo 4 GB de RAM, 2 CPU y 40 GB de SSD; recomendado 8 GB y 4 CPU (https://supabase.com/docs/guides/self-hosting/docker). El servidor los cumple, pero comparte la RAM con LiteLLM y otros servicios.
  - Respaldos de Postgres y Storage a cargo del equipo. Ruta confirmada por Johann: `/datos/trabajo/proyectos/ayllu/` (respaldos en `/datos/trabajo/proyectos/ayllu/respaldos/`).
  - **Sin UPS ni internet de respaldo confirmados.** Si el servidor cae, cae todo el producto, no solo la IA. Para la demo: video de respaldo y verificar el servidor antes de presentar.
  - Secretos nuevos que no se commitean: `POSTGRES_PASSWORD`, `JWT_SECRET`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `DASHBOARD_PASSWORD`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`, `GOOGLE_SECRET`, entre otros. La guía oficial exige cambiar todos los valores por defecto antes del primer arranque.
  - Sin SMTP configurado, Auth no envía correos. El flujo actual no los necesita (Google y contraseña creada sobre una cuenta ya verificada; CC-03). **Pendiente de verificar** con el ajuste de autoconfirmación.
- **Qué cambia en otros documentos:**
  - `docs/cambios/CC-05.md`.
  - `docs/plan.md` (Tecnología, Riesgos).
  - PRP 000 (Vercel queda descartado).
  - Nuevo PRP 010.
