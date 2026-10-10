# PRP 007 — Datos semilla de la demo

- Caso de uso: CU-07 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (reducido por CC-09: el guion, el QR y el video pasan a `docs/entrega/demo.md`)
- Rama: `cu-07/datos-semilla`

## Objetivo
Una base de datos lista para la demo, repetible y sin datos reales, cargada **solo** desde `supabase/seed.sql`:
- Artesanos ficticios aprobados y uno pendiente.
- Productos publicados con ficha completa, etiquetas y fotos.
- Fotos semilla con su licencia anotada.

## Por qué
La demo del pitch de 3 minutos necesita una vitrina con contenido desde el primer segundo, sin depender de que alguien cree productos en vivo. Tener los datos en `seed.sql` evita escribirlos en el código de la app (CC-09).

## Criterios de aceptación
- [ ] `supabase/seed.sql` deja la vitrina lista para la demo:
  - 3–5 artesanos ficticios `aprobada`, de lugares distintos (al menos uno en Lobitos).
  - 8–12 productos publicados de varios tipos, con `ficha` completa (título y etiquetas incluidos), `revision_ia = aprobada` y al menos una fila `publicada` en `foto_producto`.
  - Mezcla de `en_stock` y `a_pedido`, sin cantidades (CC-09).
  - 1 artesano `pendiente`, para mostrar el panel del administrador.
- [ ] Las fotos son propias del equipo o de libre uso, con su licencia anotada en `supabase/seed/fotos/LICENCIAS.md`.
- [ ] Ningún nombre, foto o dato proviene del padrón ni de personas reales sin su consentimiento (regla 15).
- [ ] No hay datos de prueba en `src/` ni en `AGENTS.md`: una búsqueda de los nombres semilla en `src/` no encuentra nada.
- [ ] `seed.sql` se aplica sin errores sobre una base limpia con las migraciones 0001–0006, y se puede aplicar dos veces sin duplicar filas.

## Contexto necesario
- **Dominio:** todo el glosario; regla 15.
- **Contratos:** todas las tablas (incluida `foto_producto`), para que los datos semilla cumplan las restricciones; §Convenciones (datos de prueba).
- **Decisiones:** `revision-alcance.md` §5 (datos personales); `CC-09.md`.
- **Código existente a imitar:** `supabase/seed.sql` inicial (PRP 004).
- **Documentación externa:** https://supabase.com/docs/guides/local-development/seeding-your-database.
- **Trampas conocidas:**
  - **Tablas de Supabase:** los datos semilla de `perfil` necesitan usuarios en `auth.users`. Las dos cuentas de la demo (artesano y comprador) se crean a mano con login real; el resto de artesanos pueden ser perfiles sin login, insertados con un uuid fijo si la clave foránea lo permite. Si no lo permite, **detenerse y consultar** antes de cambiar el esquema.
  - **Idempotencia:** usar uuid fijos y `on conflict do nothing`.
  - **Fotos semilla:** se suben a `fotos/` con un script, o a mano desde Supabase Studio; `seed.sql` solo guarda las rutas.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| modificar | `supabase/seed.sql` | datos semilla completos de la demo |
| crear | `supabase/seed/fotos/LICENCIAS.md` | origen y licencia de cada foto semilla |
| crear | `supabase/seed/fotos/*.jpg` | fotos semilla (≤ 300 KB cada una) |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Fotos semilla y su licencia.
2. `seed.sql` completo; aplicarlo dos veces sobre una base limpia.
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
