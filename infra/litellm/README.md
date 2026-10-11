> Integración vigente y pasos pendientes del servidor: [conectar IA](../../docs/entrega/conectar-ia-servidor.md). La guía reemplaza las instrucciones de red y reintentos descritas abajo.

# Proxy de IA: paquete para el operador autorizado

PRP 009. Preparado para `/datos/trabajo/proyectos/ayllu/litellm/`;
**no desplegado**. Solo Johann y la laptop autorizada operan el servidor.
No reinstalar Docker ni usar el puerto 8080. No hay Postgres, Redis, claves
virtuales, registro de gasto ni un servicio de administración adicional.

## Preparar y arrancar

Requisitos: Docker y Compose existentes, puerto 4000 libre, dos llaves de
proyectos Gemini aprobados y presupuesto/acceso a los modelos confirmado.

1. Copiar estos cuatro archivos a la ruta acordada. El propietario crea `.env`:

   ```bash
   cd /datos/trabajo/proyectos/ayllu/litellm
   umask 077
   cp .env.example .env
   chmod 600 .env
   # Completar con un editor seguro; nunca pegar llaves en chat o Git.
   ```

2. Definir una `LITELLM_MASTER_KEY` aleatoria, larga y con prefijo `sk-`, y
   `IA_KEY_1`/`IA_KEY_2`. Los valores vacíos bloquean Compose. Cada proyecto debe
   tener acceso a los tres modelos; varias llaves del mismo proyecto **no**
   aumentan su cuota. Confirmar nivel, límites y presupuesto con el propietario.

3. Validar y arrancar; no adjuntar la salida expandida de `compose config`,
   pues contiene las llaves:

   ```bash
   docker compose config --quiet
   docker compose pull
   docker compose up -d
   docker compose ps
   curl --fail http://127.0.0.1:4000/health/liveliness
   ```

La imagen fijada es `ghcr.io/berriai/litellm:v1.101.5`. Digest observado al
preparar: `sha256:e267d553e944bc2f605ef88adc81bedcaa63dee4bedecadfece68dad94ad0f2f`.
La prueba de salud solo comprueba el proceso: no llama a Gemini ni gasta cuota.
**No usar `/health` como sonda periódica:** puede ejecutar inferencias.

## Alias y recuperación

| Alias | Modelo Gemini | Uso |
| --- | --- | --- |
| `ayllu-texto` | `gemini/gemini-3.8-flash` | Ficha, evaluación con foto y traducción |
| `ayllu-audio` | `gemini/gemini-3.8-flash` | Audio mediante chat multimodal |
| `ayllu-imagen` | `gemini/gemini-2.5-flash-image` | Edición de foto, contrato CC-12 |

Cada alias tiene dos deployments, uno por llave. `simple-shuffle` distribuye
las llamadas; dos reintentos y cooldown de 30 s recuperan errores de
autenticación/429 mientras queda una deployment disponible. No es un respaldo
de proveedor ni garantiza servicio si ambos proyectos agotan cuota. No se
reintentan solicitudes inválidas ni modelos inexistentes. Al reiniciar, el
cooldown en memoria se pierde. Sin base de datos, la clave maestra es la única
credencial del proxy: no entregarla a navegador ni APK.

## Publicar por el túnel existente

Johann configura `ayllu-ia.likadev.com` → `http://localhost:4000` **solo si el
conector comparte el espacio de red del host**. El conector informado corre en
Docker: su `localhost` normalmente es el propio contenedor, no el servidor.
El operador debe comprobar su red antes de publicar; no abrir 4000 a la LAN
para sortearlo. Cualquier cambio del túnel/red requiere autorización de Johann.

La imagen incluye contenido estático en `/ui/` (localmente responde 200).
No se configuró una UI administrativa, pero **no se cumple una exigencia de
eliminar su ruta**. El operador debe restringir en el túnel las rutas no usadas
por Ayllu; publicar únicamente los endpoints de inferencia acordados. No hay
una bandera inventada para desactivar esa UI en este paquete.

Las Edge Functions usan `Authorization: Bearer <clave maestra>`. Cristopher
configura sus secretos `IA_BASE_URL=https://ayllu-ia.likadev.com`, `IA_API_KEY`
y `IA_TIMEOUT_MS`; nunca variables `VITE_`. No usar login interactivo de Access.
Si Johann exige Access, acordar primero service token y cabeceras con el dueño
del cliente: este PRP no modifica el helper ni la configuración de Supabase.

## Verificación del operador

Desde una terminal privada, leer la clave sin escribirla en historial:

```bash
read -rsp 'Clave del proxy: ' LITELLM_MASTER_KEY; printf '\n'
BASE_URL=https://ayllu-ia.likadev.com
curl -sS -o /dev/null -w '%{http_code}\n' "$BASE_URL/v1/models"
# Esperado: 401, no página de login ni redirección.
curl --fail "$BASE_URL/v1/models" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
curl --fail "$BASE_URL/v1/chat/completions" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"ayllu-texto","messages":[{"role":"user","content":"Responde solamente OK"}]}'
unset LITELLM_MASTER_KEY
```

Las inferencias siguientes consumen cuota: ejecutarlas solo con aprobación.
Registrar código HTTP y estructura, no contenido privado ni credenciales:

- Texto 200 con `choices[].message.content`; repetir con una foto propia como
  `{ "type": "image_url", "image_url": { "url": "data:image/jpeg;base64,..." } }`.
- Imagen: `POST /v1/images/edits`, formulario con `model=ayllu-imagen`, `image`
  y `prompt`; comprobar 200 y `data[].b64_json`. El propietario debe confirmar
  acceso al modelo 2.5 y facturación; esta selección contractual no prueba acceso.
- Audio real de 5 s del WebView: chat con `model=ayllu-audio` y contenido
  `{ "type": "file", "file": { "file_data": "data:audio/webm;base64,..." } }`.
  Registrar MIME efectivo y transcripción. **Bloqueo de CU-03:** el helper
  actual manda `file.url`, no el formato documentado `file_data`/`file_id`.
  El responsable debe corregirlo y probarlo; CU-09 no lo modifica.
- Invalidar temporalmente una llave de proveedor en una copia controlada,
  recrear el contenedor y comprobar recuperación con la otra; restaurar luego.
  No confundir una clave maestra incorrecta (401) con failover del proveedor.
- Con autorización, reiniciar el servidor y comprobar proceso, túnel e
  inferencia 200. `restart: unless-stopped` no reinicia un servicio detenido
  intencionadamente. Docker debe estar habilitado al arranque.
- CU-03 comprueba proxy caído → `502 ia_no_disponible` y ficha manual;
  no es una prueba cubierta únicamente por arrancar este contenedor.

## Operación y reversión

`docker compose logs --tail 100 litellm` permite diagnóstico local. No activar
`--detailed_debug`; los errores del proveedor pueden contener datos sensibles.
Logs Docker acotados a tres archivos de 10 MB: esto limita tamaño, **no**
establece retención temporal. Johann confirma política y acceso antes de operar.
Sin DB no se respaldan conversaciones: conservar configuración en Git y
secretos en el mecanismo privado que apruebe el propietario, nunca en Git.

Rotación: revocar una llave, editar `.env` con permisos 600 y ejecutar
`docker compose up -d --force-recreate`. Para la clave maestra coordinar la
actualización de `IA_API_KEY` en las Edge Functions; habrá una ventana de corte.
Verificar modelos/inferencia y recién después revocar la credencial anterior.

Reversión: `docker compose down` y retirar únicamente la ruta del túnel con
autorización. No borrar datos de Supabase ni volúmenes ajenos. Conservar `.env`
protegido y el digest anterior para una actualización posterior.

## Fuentes y pendientes

- [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash).
- [Proveedor Gemini y audio](https://docs.litellm.ai/docs/providers/gemini).
- [Router, reintentos y cooldown](https://docs.litellm.ai/docs/routing).
- [Sondas de salud](https://docs.litellm.ai/docs/proxy/health).
- [Versión fijada](https://github.com/BerriAI/litellm/releases/tag/v1.101.5).
- [Cuotas por proyecto y nivel](https://ai.google.dev/gemini-api/docs/rate-limits).

Presupuesto, llaves reales, restricción de UI/túnel y pruebas pagadas los
coordina el operador del servidor.
