# Traspaso CU-09: paquete local, despliegue pendiente

- Responsable original: Cristopher; preparación por Luis a solicitud del usuario.
- Rama: `cu-09/proxy-ia-litellm`; base `main` integrada `1a891e2`.
- Checkout aislado: `C:/Users/Luis/OneDrive/Escritorio/hachaton/HACKATHON-CU09`.
- Archivos propios: los cuatro de `infra/litellm/` y este traspaso.
- Sin acceso al servidor, llaves reales, facturación ni cambios a Supabase.

## Decisiones y evidencia local

Gemini directo: texto/audio `gemini/gemini-3.8-flash` por elección del usuario;
imagen `gemini/gemini-2.5-flash-image` según CC-12, sin cambiar contratos.
Dos deployments por alias con variables de entorno. Cuota y presupuesto
dependen de proyecto/nivel, no del número de llaves.

- Imagen oficial `ghcr.io/berriai/litellm:v1.101.5` descargada; versión de
  biblioteca en runtime `1.101.5`, proveedor del modelo 3.8 reconocido `gemini`.
  Tag `v1.101.5-stable` no existe; no se utilizó. Digest:
  `sha256:e267d553e944bc2f605ef88adc81bedcaa63dee4bedecadfece68dad94ad0f2f`.
- Compose válido con tres valores ficticios en una copia TEMP; binding
  `127.0.0.1:4000`, salud `healthy`, `/health/liveliness` 200.
  Clave maestra vacía rechazada por Compose (salida 1, interpolación obligatoria).
- `/v1/models` sin clave 401; con clave ficticia del proxy 200 con alias.
  Reinicio del contenedor y sonda 200. No equivale a reiniciar el servidor.
- Copia TEMP con `mock_response` (no configuración entregada): POST chat sin
  clave 401, clave incorrecta rechazada 400, clave ficticia correcta 200 con
  `choices[].message.content`. Primer sondeo antes de completar el arranque
  no conectó; el segundo, tras 20 s, dio estos resultados. Sin inferencia real.
- Router real en esa imagen + servidor HTTP Gemini simulado local: 12 llamadas
  de texto recuperan llave inválida (13 intentos); 12 llamadas del alias audio
  recuperan 429 (13 intentos). No se llamó a Google; no prueba audio real.
- `/ui/` responde 200 en la imagen fijada. Sin DB no se configuró administración,
  pero eliminar la ruta **no está comprobado ni implementado**; Johann debe
  restringir las rutas del túnel antes de publicarlo.
- App de la base: 184/184 pruebas, 18 archivos (`vitest run --no-cache`).
  Lint sin errores, seis avisos anteriores acceso/admin. Prettier y ambos
  TypeScript pasan; builds web/artesano pasan con aviso de tamaño de bundle.
  GNU make no disponible: comandos constituyentes ejecutados, no `make verify`.
- Evidencia externa: `C:/Users/Luis/AppData/Local/Temp/cu09-*.log`,
  `cu09-models.json` y `ayllu-cu09-local-validation/`.
  Los contenedores propios de prueba se retiran tras la validación.

## Bloqueos y pruebas pendientes del operador

- [ ] Johann/laptop autorizada aprueban despliegue, ruta/red del túnel y política
      de logs. `localhost` en el conector Docker puede no ser el servidor.
- [ ] Proyectos distintos, acceso a los modelos, cuotas, presupuesto y manejo
      del agotamiento confirmados; el modelo 2.5 de imagen puede requerir acceso
      o facturación específicos.
- [ ] Dominio público: ausencia de clave 401; texto autorizado 200 real.
- [ ] Foto original por `image_url` 200; edición de imagen 200 `data[].b64_json`.
- [ ] Audio WebView real de cinco segundos y MIME registrado: el helper actual
      de CU-03 usa `file.url`, mientras LiteLLM documenta `file_data`/`file_id`.
      Su responsable debe resolverlo; no modificado en este PRP.
- [ ] Llave Gemini inválida real recupera con la segunda deployment.
- [ ] Reinicio real del servidor recupera proxy, túnel e inferencia.
- [ ] CU-03: proxy apagado devuelve `502 ia_no_disponible`, permite ficha manual.
- [ ] Revisión independiente y recibo nativo válidos antes de commit/publicación;
      el problema de autoridad de revisión comunicado por el orquestador sigue
      pendiente. Este traspaso no declara revisión ni despliegue aprobados.

## Siguiente paso y reversión

Entregar este paquete al operador, resolver audio con el dueño de CU-03 y
completar la checklist con evidencia sin secretos. No desplegar desde este agente.
Reversión del paquete: retirar únicamente estos cinco archivos antes de integrar.
Tras despliegue autorizado: detener solo el proyecto Compose LiteLLM y retirar
su ruta del túnel; no borrar datos o volúmenes de otros servicios.
