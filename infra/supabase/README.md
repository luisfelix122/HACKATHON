# Levantar la BD compartida de Ayllu

El operador instala Supabase en el servidor; los integrantes conectan sus apps
con la URL de la API y la clave publicable. El agente prepara archivos localmente,
sin entrar al servidor. El despliegue y sus resultados siguen pendientes.

## Recorrido

1. Comprobar acceso del operador, espacio y puertos libres.
2. Instalar la versión fijada, generar secretos y arrancar Supabase.
3. Publicar únicamente la API por Cloudflare; mantener Studio y Postgres privados.
4. Aplicar el esquema base y coordinar las migraciones de 004 y 005.
5. Ejecutar las pruebas de cada rama y el recorrido conjunto antes del merge.

No ejecutes todos los bloques de una vez: comprueba el resultado de cada paso.
Si ya existe Supabase en la ruta, detente y revisa esa instalación; no sobrescribas
su `.env`, datos ni volúmenes.

## 1. Comprobar el servidor

En la terminal Linux del servidor, con la cuenta que Johann autorizó para operar:

```bash
id -un
docker version
docker compose version
df -h /datos
free -h
ss -ltn
command -v git openssl jq nano
```

No compartas `.env`, tokens ni salidas que contengan secretos. Docker Compose debe
ser al menos 2.24.4 para reemplazar puertos con `!override`. Confirma que 8000,
8001, 5432 y 8090 están libres. Si hay servicios existentes, no los detengas.

| Servicio | Puerto del host | Acceso |
| --- | --- | --- |
| API filtrada de Ayllu | `127.0.0.1:8000` | Cloudflare → API pública |
| Gateway oficial, con Studio | `127.0.0.1:8001` | túnel SSH por Tailscale |
| Postgres directo | `127.0.0.1:5432` | operador mediante SSH por Tailscale |
| Pooler | sin publicar | red interna Docker |
| Web | `127.0.0.1:8090` | Cloudflare → web |

El gateway oficial también sirve Studio. Por eso el túnel público apunta al
proxy filtrado de 8000, que solo permite Auth, REST, Storage, Realtime, Functions
y GraphQL. `/`, `/project/`, `/api/` y los demás destinos devuelven 404.

## 2. Instalar Supabase y configurar secretos

Para una instalación nueva, una vez confirmados ruta y permisos:

```bash
(
set -eu
mkdir -p /datos/trabajo/proyectos/ayllu
cd /datos/trabajo/proyectos/ayllu
test ! -e supabase
git clone --filter=blob:none --sparse --depth 1 --branch self-hosted/v0.8.2 https://github.com/supabase/supabase.git supabase
test "$(git -C supabase rev-parse --show-toplevel)" = /datos/trabajo/proyectos/ayllu/supabase
test "$(git -C supabase config --get remote.origin.url)" = https://github.com/supabase/supabase.git
git -C supabase sparse-checkout set docker
cd supabase/docker
cp .env.example .env
chmod 600 .env
sh utils/generate-keys.sh --update-env
sh utils/add-new-auth-keys.sh --update-env
)
```

El bloque se detiene si la carpeta ya existe, falla el clon o Git identifica otro
repositorio. No ejecutes `sparse-checkout` por separado después de un error de
clonado: Git podría encontrar un repositorio padre y modificarlo. Los scripts muestran claves
en la terminal privada del operador; no pegues esa salida en el chat ni la guardes
en un log compartido. No vuelvas a generarlas sobre una instalación con usuarios.

Transfiere desde la laptop los archivos de este PRP por el canal que autorice
Johann. Coloca `docker-compose.override.yml` junto al Compose oficial y conserva
`respaldo.sh` en esa misma carpeta. No reemplaces el `.env.example` oficial con
nuestro archivo: el de Ayllu es solo una lista de nombres adicionales.

Edita `.env` con `nano .env`. La configuración de URLs y acceso es:

| Nombre | Valor |
| --- | --- |
| `SUPABASE_PUBLIC_URL` | `https://ayllu-api.likadev.com` |
| `API_EXTERNAL_URL` | `https://ayllu-api.likadev.com/auth/v1` |
| `SITE_URL` | `https://ayllu.likadev.com` |
| `ADDITIONAL_REDIRECT_URLS` | `https://ayllu.likadev.com/**,http://localhost:5173/**,http://127.0.0.1:5173/**,pe.ayllu.artesano://auth**` |
| `ENABLE_EMAIL_SIGNUP` | `true` |
| `ENABLE_EMAIL_AUTOCONFIRM` | `true` |
| `DISABLE_SIGNUP` | `false` |
| `POOLER_TENANT_ID` | `ayllu` |
| `GOOGLE_ENABLED` | `false` hasta configurar Google; después `true` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET` | los escribe el operador cuando estén disponibles |

Todos los integrantes usarán el puerto 5173 para desarrollo. Si usan otro origen,
el operador agrega el origen exacto a la lista de retornos. Para Google, crea un
cliente OAuth de tipo Web application y registra como callback
`https://ayllu-api.likadev.com/auth/v1/callback`. Si la aplicación de Google está
en modo prueba, agrega las cuentas del equipo como usuarios de prueba.

Revisa que `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`,
`DASHBOARD_PASSWORD`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY`,
`REALTIME_DB_ENC_KEY` y las claves S3 hayan cambiado respecto a los ejemplos.
Completa `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `JWT_KEYS` y
`JWT_JWKS` mediante los scripts oficiales. Usa un `DASHBOARD_PASSWORD` nuevo y
alfanumérico con letras. No envíes credenciales administrativas a los integrantes.

Nuestro override activa los JWKS de Auth, Realtime, Storage y Functions para las
claves nuevas; PostgREST ya los toma del Compose oficial. Email autoconfirmado es
una decisión aceptada para la hackatón (CC-09), sin recuperación por correo.

```bash
docker compose config --quiet
docker compose pull
docker compose up -d --wait
docker compose ps
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/rest/v1/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8000/
```

Esperado: contenedores saludables, REST sin clave devuelve 401, raíz devuelve
404. `config --quiet` valida sin imprimir los secretos interpolados. Si hay un
fallo, comparte únicamente el nombre del servicio y el error redactado.

## 3. Publicar API y administrar por Tailscale

Johann configura en el túnel existente:

- `ayllu-api.likadev.com` → `http://127.0.0.1:8000`.
- `ayllu.likadev.com` → `http://127.0.0.1:8090`, cuando la web esté instalada.

No agregues rutas públicas a 8001 ni a 5432. Si cloudflared corre en un contenedor,
su `localhost` es ese contenedor: Johann debe resolver la conexión al host o la
red Docker antes de continuar. No añadas un login interactivo de Cloudflare
Access a la API del frontend. Comprueba REST 401, raíz 404 y WebSocket de Realtime
desde fuera del servidor antes de entregarlo al equipo.

Para Studio y migraciones, el operador usa SSH al host de Tailscale con forwards
locales. Define primero el usuario y host autorizados; no uses una IP pública:

```bash
ssh -N -L 8001:127.0.0.1:8001 -L 55432:127.0.0.1:5432 USUARIO@HOST_TAILSCALE
```

Deja esa terminal abierta. Studio está en `http://127.0.0.1:8001`, con la
autenticación del dashboard. Postgres está en el puerto local 55432; no necesita
publicarse en la interfaz Tailscale del servidor.

## 4. Validar 004 y 005 antes de integrar

Esta primera instancia es de **validación de integración**, con datos ficticios.
No la declares producción ni autorices resets de los integrantes.

El operador aplica primero las migraciones de la Fase 0 de `main` (0001–0003).
Antes de validar 004/005, revisa y combina sus ramas con el mismo `main` en una
copia de integración: conserva sus migraciones 0201 y 0301, más 0101 si incluyes
CU-01. Registra el SHA candidato y la lista de migraciones. Aplicar SQL de una
rama no equivale a aprobar su merge.

Si un compañero todavía no subió su rama, primero la sube y abre PR. No trabajen
directamente en `main`. Ejecuten `make verify` y `make build` en cada rama y en la
copia combinada. Solo el operador aplica las migraciones del candidato revisado.

En una terminal Bash de la laptop, dentro del checkout que corresponda y con el
forward abierto, lee la URL de Postgres de forma oculta. La conexión apunta a
`127.0.0.1:55432/postgres`, usuario `postgres`, con contraseña codificada en URL:

```bash
read -r -s -p 'URL Postgres por el forward SSH: ' AYLLU_DB_URL
printf '\n'
npx supabase db push --db-url "$AYLLU_DB_URL" --dry-run
npx supabase db push --db-url "$AYLLU_DB_URL"
unset AYLLU_DB_URL
```

La URL no se escribe literalmente en el historial; no compartas salidas de
depuración. Comprueba el dry-run antes de aplicar. No uses `--include-all` ni
modifiques el historial para forzar migraciones fuera de orden: si ya hay 0301
aplicada y falta 0201, detente y revisa el candidato con el integrador.

Aplica `supabase/seed.sql` del candidato solo a esta BD de prueba, mediante el SQL
Editor privado o `psql` del operador. El seed no crea usuarios con una contraseña
conocida: el equipo crea sus cuentas por Auth y el operador asigna el admin por
SQL según PRP 001. Carga también las fotos ficticias en las rutas de Storage que
define el seed; ejecutar SQL no sube las imágenes.

### Pruebas SQL sin Docker en las laptops

`make test-db` usa el Supabase local de cada checkout; no prueba automáticamente
este servidor. El operador ejecuta pgTAP en el contenedor del servidor durante
una ventana acordada, mientras nadie modifica los datos de prueba. El override
incluye un runner oficial `ghcr.io/supabase/pg_prove:3.36`, activado solo con el
perfil `pruebas`. Los archivos de prueba usan transacciones y rollback,
pero eso no aísla sus bloqueos de los clientes que están probando a la vez.

Desde `supabase/docker`, con una copia revisada de los tests en
`/datos/trabajo/proyectos/ayllu/pruebas/`:

```bash
docker compose --profile pruebas pull pruebas-sql
docker compose --profile pruebas run --rm --no-deps pruebas-sql
```

El runner rechaza una carpeta vacía: una ejecución sin tests no cuenta como
aprobación. Si falta pgTAP o falla la descarga del runner, registra el bloqueo;
no omitas las pruebas de
permisos. Antes de aceptar 004 verifica lectura anónima, producto retirado y
campos privados. Para 005 verifica RPC, entrada inválida, órdenes ajenas,
mensajes entre las dos partes y Realtime. Prueba finalmente vitrina → ingreso →
pedido → mensaje con web y Android. Guarda resultados por PRP y por SHA.

Los 11 fallos previos de `producto.test.sql` detectados en la BD local requieren
aclaración; no se declaran solucionados por levantar una instancia nueva.

Tras aprobar los PR, el integrador autoriza cada merge. Comprueba que el `main`
resultante contiene exactamente las migraciones y contratos ya validados. Si
cambia el candidato, vuelve a probar antes de usarlo como versión de la demo.
No elimines migraciones aplicadas ni resetees esta instancia compartida.

## 5. Entregar conexión al equipo y publicar la web

Cada laptop configura su `.env.local` privado con:

```dotenv
VITE_SUPABASE_URL=https://ayllu-api.likadev.com
VITE_SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICABLE_DEL_SERVIDOR
```

La clave publicable permite usar la API bajo RLS; nunca entregues `service_role`,
`SUPABASE_SECRET_KEY`, claves de Postgres ni las de Google. Reinicia Vite después
de cambiar el entorno. Para la APK recompila con esa misma URL. Tus compañeros
no necesitan Docker para probar sus pantallas contra esta instancia.

En la laptop, compila `make build` con el entorno del servidor. Transfiere
`dist-web/`, `infra/web/compose.yaml` y `infra/web/Caddyfile` mediante el canal
aprobado a `/datos/trabajo/proyectos/ayllu/web/`, con `dist-web/` dentro de ella.
En la terminal del servidor:

```bash
cd /datos/trabajo/proyectos/ayllu/web
docker compose config --quiet
docker compose up -d --wait
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8090/producto/prueba
```

La ruta profunda devuelve 200 y carga la SPA. Caddy usa imagen oficial fijada,
licencia Apache-2.0; sirve la web y filtra las rutas de la API, sin dependencia npm.

## 6. Respaldo y cierre de validación

El operador ejecuta `sh respaldo.sh` desde la carpeta del Compose oficial.
Genera un dump Postgres, verifica su catálogo y retiene siete días. El archivo
queda con permisos privados y solo se publica si termina bien. Hace falta además
respaldar los archivos de Storage (`volumes/storage`): el dump incluye metadatos,
no las imágenes. Comprueba restauración en una BD separada antes de confiar en él.

Programa a las 03:00 de la zona del servidor mediante `crontab -e`, sin borrar
las tareas que ya existan:

```cron
0 3 * * * /bin/sh /datos/trabajo/proyectos/ayllu/supabase/docker/respaldo.sh >> /datos/trabajo/proyectos/ayllu/respaldos/respaldo.log 2>&1
```

Primero crea y protege la carpeta de respaldos con `mkdir -p` y `chmod 700`.
Registra la zona horaria del servidor, fecha del dump y prueba de restauración.
No reinicies el host durante pruebas del equipo: Johann autoriza esa ventana.
Registra los resultados de OAuth, autoconfirmación, Realtime, reinicio, permisos
y respaldos en `docs/traspasos/CU-10-cristopher.md`.

## Referencias

- [Supabase self-hosted con Docker](https://supabase.com/docs/guides/self-hosting/docker).
- [OAuth self-hosted](https://supabase.com/docs/guides/self-hosting/self-hosted-oauth).
- [Claves y JWKS](https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys).
- [Reemplazo de puertos Compose](https://docs.docker.com/reference/compose-file/merge/).
- [Runner oficial pg_prove](https://github.com/supabase/cli/pkgs/container/pg_prove).
