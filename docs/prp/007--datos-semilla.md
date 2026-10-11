# PRP 007 — Datos semilla de la demo

- Caso de uso: CU-07 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (reducido por CC-09; la muestra está en `supabase/seed.sql` desde CC-10). Módulo B; requiere el PRP 004 en `main`
- Rama: `cu-07/datos-semilla`

## Objetivo
Una base de datos lista para la demo, repetible y sin datos reales, cargada **solo** desde `supabase/seed.sql`:
- Artesanos ficticios aprobados y uno pendiente.
- Productos publicados con ficha completa, etiquetas y fotos.
- Fotos semilla con su licencia anotada.

## Por qué
La demo del pitch de 3 minutos necesita una vitrina con contenido desde el primer segundo, sin depender de que alguien cree productos en vivo. Tener los datos en `seed.sql` evita escribirlos en el código de la app (CC-09).

## Criterios de aceptación
- [ ] `supabase/seed.sql` (muestra de CC-10) deja la vitrina lista para la demo, y se revisa contra las migraciones reales:
  - 7 artesanos ficticios `aprobada` en Los Órganos, Cabo Blanco y Lobitos (dos asociaciones y un independiente).
  - 21 productos publicados de los cinco tipos, con `ficha` completa (título y etiquetas), `revision_ia = aprobada` y su foto `original` publicada.
  - Mezcla de `en_stock` y `a_pedido`, sin cantidades (CC-09).
  - 1 artesano `pendiente` y 1 `rechazada` con nota, para el panel del administrador.
  - 1 producto `retirado` (no debe verse en la vitrina) y 1 `borrador` (se ve en la APK).
  - 1 comprador y 2 órdenes de ejemplo (`pago_pendiente` con mensajes y `enviada` con número de guía).
- [ ] Los WhatsApp marcadores (`+5190000000N`) se reemplazan por el número del equipo antes de la demo.
- [ ] Las fotos son propias del equipo o de libre uso, con su licencia anotada en `supabase/seed/fotos/LICENCIAS.md`.
- [ ] Ningún nombre, foto o dato proviene del padrón ni de personas reales sin su consentimiento (regla 15).
- [ ] No hay datos de prueba en `src/` ni en `AGENTS.md`: una búsqueda de los nombres semilla en `src/` no encuentra nada.
- [ ] `seed.sql` se aplica sin errores sobre una base limpia con todas las migraciones (núcleo y módulos), y se puede aplicar dos veces sin duplicar filas.

## Contexto necesario
- **Dominio:** todo el glosario; regla 15.
- **Contratos:** todas las tablas (incluida `foto_producto`), para que los datos semilla cumplan las restricciones; §Convenciones (datos de prueba).
- **Decisiones:** `revision-alcance.md` §5 (datos personales); `CC-09.md`.
- **Código existente a imitar:** `supabase/seed.sql` inicial (PRP 004).
- **Documentación externa:** https://supabase.com/docs/guides/local-development/seeding-your-database.
- **Trampas conocidas:**
  - **Tablas de Supabase:** el seed inserta en `auth.users` usuarios sin contraseña conocida (no sirven para entrar), con los campos de token en `''` para no romper GoTrue. Las cuentas de la demo (artesano, comprador y admin) se crean con login real, y el admin se asigna por SQL (PRP 001).
  - **Idempotencia y orden:** uuid fijos, `on conflict do nothing`, y cada bloque solo corre si su tabla existe, para que `supabase db reset` funcione desde el PRP 001.
  - **Servidor:** no aplicar el seed en el servidor sin migraciones ni sin acuerdo del equipo; es una muestra de demo.
  - **Fotos semilla:** se suben a `fotos/` con un script, o a mano desde Supabase Studio; `seed.sql` solo guarda las rutas.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| modificar | `supabase/seed.sql` | ajustes a la muestra si las migraciones difieren del contrato |
| crear | `supabase/seed/fotos/LICENCIAS.md` | origen y licencia de cada foto semilla |
| crear | `supabase/seed/fotos/*.jpg` | fotos semilla (≤ 300 KB cada una) |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Fotos semilla y su licencia.
2. Revisar `seed.sql` contra todas las migraciones (núcleo y módulos); aplicarlo dos veces sobre una base limpia.
3. Subir las fotos al bucket `fotos` del servidor y revisar la vitrina en 360 px y 1440 px.

## Validación
1. `make verify`.
2. **Pruebas a crear:** no aplica (solo datos). La prueba es aplicar `seed.sql` dos veces sobre una base limpia sin errores ni duplicados.
3. **Prueba manual:** `/?lugar=Lobitos` muestra productos con fotos y etiquetas; `/admin` muestra el artesano pendiente.

## Fuera de alcance
- Guion de demo, QR impreso, video de respaldo, ensayos, APK final y `CHANGELOG.md`: son tareas de entrega en `docs/entrega/demo.md` (CC-09).
- Material del pitch (diapositivas).

## Notas / riesgos
- Si se cambia el esquema después de este PRP, actualizar `seed.sql` en el mismo PR.
