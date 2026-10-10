# PRP 007 — Datos semilla y guion de demo

- Caso de uso: CU-07 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo
- Rama: `cu-07/semilla-demo`

## Objetivo
Una demo de unos 2:30, repetible y sin datos reales:
- Datos semilla ficticios cargados.
- Guion en `docs/entrega/demo.md`.
- APK final instalada en el celular del artesano.
- Web desplegada.
- Video de respaldo grabado.
- Entrada en `CHANGELOG.md`.

## Por qué
El mentor recomendó una demo que no falle. Este PRP también sostiene el pitch de 3 minutos.

## Criterios de aceptación
- [ ] `supabase/seed.sql` deja la vitrina lista para la demo:
  - 3–5 artesanos ficticios `aprobada`, de lugares distintos (al menos uno en Lobitos).
  - 8–12 productos publicados de varios tipos, con fotos propias del equipo o de libre uso con su licencia anotada.
  - 1 artesano `pendiente`, para mostrar el panel del administrador.
- [ ] Ningún nombre, foto o dato proviene del padrón ni de personas reales sin su consentimiento.
- [ ] `docs/entrega/demo.md` sigue el recorrido de `revision-alcance.md` §3 e indica en cada paso qué es real y qué es simulado.
- [ ] Hay un QR impreso que apunta a `https://<vercel>/?lugar=Lobitos`.
- [ ] La demo se ejecuta completa dos veces seguidas en menos de 3 minutos, con la APK de release candidata.
- [ ] El video de respaldo está grabado y guardado fuera del repositorio. El guion dice dónde encontrarlo.
- [ ] `CHANGELOG.md` tiene la entrada `0.1.0`.

## Contexto necesario
- **Dominio:** todo el glosario; regla 15.
- **Contratos:** todas las tablas, para que los datos semilla cumplan las restricciones.
- **Decisiones:** `revision-alcance.md` §3 (demo) y §5 (datos personales).
- **Código existente a imitar:** `supabase/seed.sql` inicial (PRP 004).
- **Documentación externa:** https://supabase.com/docs/guides/local-development/seeding-your-database.
- **Trampas conocidas:**
  - **Tablas de Supabase:** los datos semilla de `perfil` necesitan usuarios en `auth.users`. Crear cuentas de prueba reales de Google para las dos cuentas de la demo; el resto de artesanos pueden ser perfiles sin login, insertados con un uuid fijo si la clave foránea lo permite. Si no lo permite, **detenerse y consultar** antes de cambiar el esquema.
  - **Fotos semilla:** se suben a `fotos/` con un script, o a mano desde el dashboard.
  - **Video de respaldo:** no subirlo al repositorio por su tamaño.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| modificar | `supabase/seed.sql` | datos semilla completos de la demo |
| crear | `supabase/seed/fotos/LICENCIAS.md` | origen y licencia de cada foto semilla |
| crear | `supabase/seed/fotos/*.jpg` | fotos semilla (≤ 300 KB cada una) |
| modificar | `docs/entrega/demo.md` | guion de demo |
| modificar | `CHANGELOG.md` | entrada `0.1.0` |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Fotos semilla y su licencia.
2. `seed.sql` completo; aplicarlo en el proyecto de la demo.
3. Guion en `demo.md`; QR.
4. `make apk` final e instalación; dos ensayos cronometrados.
5. Grabar el video de respaldo; actualizar `CHANGELOG.md`.

## Validación
1. `make verify`.
2. **Pruebas a crear:** no aplica (datos y documentos). La prueba es aplicar `seed.sql` sobre una base limpia sin errores.
3. **Prueba manual:** dos ensayos completos cronometrados.

## Fuera de alcance
- Material del pitch (diapositivas).
- Suscripción (solo se menciona si preguntan).

## Notas / riesgos
- Dejar las cuentas de la demo con la sesión iniciada en los dos dispositivos antes de presentar.
