# Ayllu

Vitrina digital para artesanos de las caletas del norte de Piura (Hackatón, Reto 17).

- **Web** (compradores y administrador): https://ayllu.likadev.com
- **APK de Android** (artesanos): crea productos sin conexión, la IA arma la ficha y una foto mejorada.
- **Backend:** Supabase autohospedado (https://ayllu-api.likadev.com) y proxy de IA LiteLLM con Gemini.

## Qué hace

1. El artesano toma la foto de su pieza, la describe y calcula su precio en la APK.
2. La IA propone la ficha y una foto de estudio; el artesano revisa y publica.
3. El comprador explora el catálogo en la web y pide la pieza.
4. Ambos acuerdan total y entrega en el chat del pedido; el comprador paga por Yape, Plin, cuenta bancaria o enlace de pago, y el artesano verifica el abono y despacha.

## Requisitos

- Node.js 22+ y npm.
- GNU make (en Windows: `winget install ezwinports.make`, y usar Git Bash).
- Para la APK: SDK de Android y **JDK 21** (el JDK 25 de Android Studio no sirve con Capacitor 8).

## Arrancar

```bash
npm ci
cp .env.example .env.local   # completar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev -- --mode web    # web en http://localhost:5173
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev -- --mode web` | web en desarrollo |
| `npm run dev -- --mode artesano` | pantallas de la APK en el navegador |
| `make verify` | lint, formato, tipos y pruebas |
| `npm run build:web` | genera `dist-web/` |
| `node scripts/empaquetar-functions.mjs` | genera las Edge Functions en `dist-functions/` |
| `make apk` | genera `android/app/build/outputs/apk/debug/app-debug.apk` |

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `src/vitrina/` | catálogo y ficha pública |
| `src/pedidos/` | pedidos, chat, pagos y despacho |
| `src/borradores/`, `src/publicacion/` | crear, procesar y publicar productos (APK) |
| `src/acceso/`, `src/admin/` | ingreso, registro y acreditación de artesanos |
| `supabase/migrations/` | esquema, permisos (RLS) y funciones de la base |
| `supabase/functions/` | Edge Functions: `procesar-producto` (IA) y `traducir-mensaje` |
| `infra/` | Docker de Supabase, LiteLLM y la web (Caddy) |

## Desplegar en el servidor

1. En la PC: `npm run build:web` y `node scripts/empaquetar-functions.mjs`.
2. Copiar `dist-functions/*` a `supabase/docker/volumes/functions/` y reiniciar: `docker compose restart functions`.
3. Copiar `dist-web/`, `infra/web/compose.yaml` e `infra/web/Caddyfile` a `/datos/trabajo/proyectos/ayllu/web/` y levantar: `docker compose up -d --force-recreate`.
4. Las migraciones nuevas de `supabase/migrations/` se aplican con `psql` en el contenedor `supabase-db`.

Detalle del servidor: [infra/supabase/README.md](infra/supabase/README.md) y [infra/litellm/README.md](infra/litellm/README.md).

## Equipo

Cristopher, Chero, Luis, Marvin y Johann. Reglas de trabajo en [AGENTS.md](AGENTS.md).
