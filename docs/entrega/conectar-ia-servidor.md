# Conectar la IA en el servidor

Estado (2026-10-11): aplicado en el servidor.
- LiteLLM corre en `/datos/trabajo/proyectos/ayllu/litellm`; `ayllu-texto` respondió 200.
- `functions` está en la red `ayllu-ia` con `IA_*`.
- `procesar-producto` y `traducir-mensaje` están instalados y responden 401 sin sesión por el gateway público.

Faltan las pruebas de la sección 5 desde la app. No hace falta generar un APK para desplegar las funciones.

## Lo que se aprendió en el servidor

- **`COMPOSE_FILE`:** el `.env` de Supabase traía `COMPOSE_FILE=docker-compose.yml`, sin el override. Un `docker compose up` sin `-f` recreaba el gateway sin el override: chocaba en el puerto 8000 con `api-publica` y la API pública daba 502. Ahora la línea es `COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:docker-compose.ia.yml`. Revisarla antes de cualquier `up`.
- **Archivo de IA aparte:** el servidor no usa el override del repo para la IA. La red y las variables de `functions` viven en `docker-compose.ia.yml` (copia en `infra/supabase/docker-compose.ia.yml`). Así no se reescribe el override propio del servidor.
- **Reiniciar el gateway tras recrear `functions`:** `envoy` conserva la IP vieja del contenedor y responde `503 no healthy upstream`. Después de `up --force-recreate functions`, ejecutar `docker compose restart api-gw`.

## 1. Preparar el proxy

El operador autorizado copia `infra/litellm/compose.yaml`, `config.yaml` y `.env.example` a `/datos/trabajo/proyectos/ayllu/litellm/`. Si ya existen, conservar una copia de la configuración anterior y el `.env` privado; no reemplazarlo por el ejemplo vacío.

```bash
cd /datos/trabajo/proyectos/ayllu/litellm
if ! docker network inspect ayllu-ia >/dev/null 2>&1; then
  docker network create ayllu-ia
fi
umask 077
test -f .env || cp .env.example .env
chmod 600 .env
# Editar .env localmente: LITELLM_MASTER_KEY (sk-...), IA_KEY_1 e IA_KEY_2.
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml up -d --force-recreate
docker compose -f compose.yaml ps
curl --fail http://127.0.0.1:4000/health/liveliness
```

No compartir `docker compose config` expandido, `.env`, tokens ni prompts privados. Las llaves de Gemini del mismo proyecto comparten cuota. Cada proyecto debe tener acceso a los modelos configurados. La salud comprueba el proceso, no el proveedor.

La red externa `ayllu-ia` conserva salida a Internet; no marcarla `internal`. El puerto 4000 solo escucha en la interfaz de loopback del host.

## 2. Conectar Supabase sin perder su red actual

Integrar el archivo `infra/supabase/docker-compose.override.yml` en el conjunto Compose que el operador ya usa. No reemplazar el Compose oficial completo ni sus variables existentes. El servicio `functions` conserva `default` y añade `ayllu-ia`.

Añadir al `.env` privado de ese proyecto Compose:

```dotenv
IA_BASE_URL=http://litellm:4000
IA_API_KEY=<el mismo valor privado que LITELLM_MASTER_KEY>
IA_TIMEOUT_MS=8000
```

Además deben conservarse `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` del runtime de funciones. No usar claves `VITE_` para el proxy. Si la instalación usa nombres diferentes para servicios o una red Supabase explícita, mantener esa red al aplicar el override; verificar el Compose real antes de recrear.

Desde la carpeta del Compose oficial, usando exactamente sus archivos actuales más este override:

```bash
docker compose -f docker-compose.yml -f docker-compose.override.yml config --quiet
docker compose -f docker-compose.yml -f docker-compose.override.yml up -d --force-recreate functions
```

Si el operador ya emplea otros overrides, incluirlos también, en el orden acordado. No ejecutar el ejemplo si esos nombres no coinciden con la instalación.

## 3. Cloudflared: conexión persistente

En el Compose que mantiene el conector existente, agregar `ayllu-ia` al servicio `cloudflared` conservando sus redes actuales. Fragmento para fusionar con esa configuración (no un Compose independiente):

```yaml
services:
  cloudflared:
    networks:
      - default
      - ayllu-ia
networks:
  ayllu-ia:
    external: true
    name: ayllu-ia
```

Si el conector usa otra red, conservar su nombre en vez de sustituirlo por `default`. Recrear únicamente el conector con su Compose existente. Configurar `ayllu-ia.likadev.com` hacia `http://litellm:4000`, nunca `localhost:4000` dentro del contenedor. Un `docker network connect` manual se pierde al recrear: debe quedar en Compose.

Las Edge Functions llaman directamente por Docker, por lo que no dependen del túnel. Restringir las rutas públicas a las inferencias necesarias; no publicar administración ni secretos.

## 4. Instalar las Edge Functions

Desde el checkout local actualizado:

```bash
npm run build:functions
```

Esto crea `dist-functions/procesar-producto/index.ts` y `dist-functions/traducir-mensaje/index.ts`, bundles para Deno con dependencias npm fijadas. No copiar las fuentes TypeScript sin empaquetar, cuyos imports relativos no están preparados para el runtime. El script no genera APK ni transfiere archivos.

El operador copia ambas carpetas a la ruta del host que el Compose real monta como `/home/deno/functions` (habitualmente `volumes/functions/`). Conservar la carpeta `main` y las demás funciones existentes. No copiar `.env` local ni `node_modules`. Reiniciar `functions` con los mismos archivos Compose del paso anterior. Comprobar que el router `main` existente atiende `/functions/v1/procesar-producto` y `/functions/v1/traducir-mensaje`, y que el gateway publica `/functions/v1/*`.

Si el runtime verifica JWT en `main`, confirmar su compatibilidad con las claves actuales de Supabase. Ambos handlers verifican el usuario con Auth antes de acceder a datos; no sustituir JWT de usuario por service-role en peticiones del navegador.

## 5. Comprobar el flujo, sin registrar secretos

Estas pruebas están pendientes y las realiza el operador autorizado. Las inferencias consumen cuota.

1. Autenticación del proxy: `/v1/models` sin clave o con clave incorrecta debe rechazar la solicitud. Con la clave maestra debe listar los alias; probar `/v1/chat/completions` con `ayllu-texto`. Leer la clave en terminal privada, no pegarla en historial ni logs.
2. Traducción: iniciar sesión como una parte de un pedido, abrir su chat y traducir un mensaje. La petición es `POST /functions/v1/traducir-mensaje` con `{ "mensaje_id": "UUID real", "idioma": "en" }`, cabeceras `apikey` pública y `Authorization: Bearer JWT_del_usuario`. Debe devolver `{ texto, idioma }`; un usuario ajeno no debe leerlo.
3. Producto con texto: crear un borrador propio con foto original y descripción, luego preparar con IA. La petición es `POST /functions/v1/procesar-producto` con `{ "producto_id": "UUID real", "mejorar_foto": false }` y las mismas cabeceras de usuario. Debe generar ficha y conservar la publicación como acción explícita del artesano.
4. Audio: repetir con un borrador que contenga el archivo real grabado por el dispositivo, comprobando MIME efectivo y transcripción. Puede usarse el APK ya instalado; no construir uno nuevo. No basta una prueba de texto para confirmar audio.
5. Imagen: repetir en otro borrador con `mejorar_foto: true`; comprobar variantes en Storage y selección en pantalla. Si alguna variante falla, el flujo debe conservar la foto original y presentar advertencias.
6. Recuperación: reiniciar LiteLLM y `functions`, confirmar salud y repetir una traducción. Si el proxy falla, texto/audio devuelve `502 ia_no_disponible`; el chat mantiene disponible el mensaje original.

Tiempos y reintentos del proxy (`infra/litellm/config.yaml`):

- `ayllu-texto` y `ayllu-audio`: 7 s por intento, dentro del presupuesto `IA_TIMEOUT_MS=8000` de la Edge Function.
- `ayllu-imagen`: límite configurado de 40 s por deployment, por debajo de los 45 s que espera `llamarEdicionImagenIa`. No se establece `router_settings.timeout` global: un límite global de 7 s podría terminar la llamada completa antes del límite de imagen. El valor global de respaldo `request_timeout: 45` se usa cuando no hay timeout de deployment. La duración real de las imágenes sigue pendiente de comprobar.
- Se permite un reintento para 429, 401 y 5xx; esos errores no garantizan respuesta rápida. El cooldown permite seleccionar otra deployment disponible, sin garantizar recuperación. Los timeouts no se reintentan. La Edge Function limita toda su llamada de texto/audio a 8000 ms y la de imagen a 45000 ms, aunque el proxy todavía esté completando un reintento.

Si el servidor ya tiene la versión anterior de `config.yaml` (7 s y cero reintentos para todo), copiar la nueva y ejecutar `docker compose -f compose.yaml up -d --force-recreate`. Si audio supera los 7 s en la prueba real, registrarlo y acordar un presupuesto mayor; no declararlo probado por haber levantado el contenedor.

Para diagnóstico local, revisar `docker compose logs --tail 100 functions` y los logs de LiteLLM, evitando compartir datos privados. Un 404 suele indicar función/router sin instalar; 401/403 requiere revisar sesión y autorización; 502 requiere comprobar variables, red, acceso al modelo y tiempos. No activar logs detallados de prompts.

La configuración documentada sigue [los parámetros oficiales del proxy LiteLLM](https://docs.litellm.ai/docs/proxy/config_settings) y [su router](https://docs.litellm.ai/docs/routing). El esquema de la BD se aplica por separado con las migraciones entregadas; el proxy no requiere Postgres ni Redis propios.

Los límites por deployment y el alcance global del router están documentados en [Timeouts de LiteLLM](https://docs.litellm.ai/docs/proxy/timeout).
