# Traspaso CU-10 — Supabase y web en el servidor

- Rama: `cu-10/supabase-autohospedado`, desde `main` con PRP 012 integrado.
- Responsable de los archivos: Cristopher. Operador del servidor: Johann,
  mediante su sesión de terminal y el agente que ejecuta allí.
- Estado: archivos preparados; despliegue no ejecutado por el agente.
- Alcance: tabla de archivos del PRP 010; sin contratos ni cambios de otros módulos.

## Archivos

`infra/supabase/README.md`, `docker-compose.override.yml`, `.env.example`,
`respaldo.sh`; `infra/web/compose.yaml`, `Caddyfile`; `README.md` y este traspaso.

## Decisiones de implementación

- Versión oficial `self-hosted/v0.8.2`, con gateway Envoy (`api-gw`).
- Proxy de API en loopback 8000, gateway privado 8001 para impedir que Studio
  quede publicado con la API; Postgres 5432 en loopback y pooler sin publicar.
- Caddy oficial fijado `2.10.2-alpine`, Apache-2.0, sin dependencia npm.
- Claves nuevas y JWKS en Auth, Storage, Realtime y Functions.
- Primera instancia de validación de integración: un operador aplica las
  migraciones del candidato revisado y coordina ventanas para pgTAP.

## Evidencia

- `make verify`: aprobado, 73 pruebas en 3 suites desde `main` con PRP 012.
- Verificación final antes de publicar: `make verify` y `make build` aprobados.
  Dos intentos en sandbox fallaron por archivos temporales inexistentes al
  importar una suite; fuera del sandbox pasaron las 73 pruebas sin cambiar código
  ni controles. Los builds web y artesano terminaron correctamente.
- Compose API y web: válidos con variables ficticias del ejemplo oficial;
  comprobación del perfil `pruebas` aprobada. Solo puertos loopback, sin pooler
  publicado.
- Caddy API y web: configuraciones válidas en la imagen fijada; filtro HTTP
  bloquea raíz, Studio, administración y traversal literal/codificado.
- Runner `pg_prove:3.36`: disponible; carpeta sin tests rechazada con salida 1.
- Respaldo: sintaxis válida; harness con Docker simulado y archivos ficticios
  verifica conservación de backups ante fallo, publicación ante éxito y rotación
  únicamente de dumps propios. No se ejecutó contra una BD real.
- Revisor IA de solo lectura: aprobar paquete preparado; despliegue pendiente.
- Servidor: no inspeccionado ni modificado; no se utilizaron sesiones remotas.
- OAuth, Email autoconfirmado, Realtime, Android, túnel, respaldo/restauración y
  reinicio: pendientes de ejecución por el operador.
- Los fallos SQL previos de productos no se declaran corregidos.

## Reversión del paquete

Antes de instalar, se puede revertir este paquete de infraestructura y su guía
sin tocar código de producto ni migraciones. Tras instalar, cualquier reversión
operativa requiere revisar datos y respaldos con Johann; revertir Git no revierte
la BD ni elimina servicios del servidor.

## Siguiente paso

Entregar la rama y el commit publicados al agente del servidor. Obtener los
artefactos en un checkout independiente y conservar las carpetas y volúmenes
existentes. La recuperación del repositorio padre sigue pendiente según el
reporte del operador; no repoblar ni descartar archivos de otros proyectos.
Después seguir la guía por pasos y anotar resultados sin secretos, con SHA del
candidato y migraciones. Confirmar el modo de ejecución de cloudflared antes
de modificar su configuración.
