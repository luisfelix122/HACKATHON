# PRP NNN — <Nombre>

- Caso de uso: CU-XX (`docs/plan.md`)
- Responsable: <nombre> · Revisor: <nombre>
- Estado: borrador | listo | en curso | completado
- Rama: `cu-XX/<nombre-corto>`

## Objetivo
<Estado final concreto: qué podrá hacer el usuario.>

## Por qué
<Valor para el usuario; qué problema de `docs/proyecto.md` resuelve.>

## Criterios de aceptación
- [ ] <resultado observable y comprobable>
- [ ] <...>

## Contexto necesario
- Dominio: <términos de `docs/dominio.md`>
- Contratos: <secciones de `docs/contratos.md` que usa o cambia>
- Decisiones: <`docs/decisiones/NNNN-*.md`>
- Código existente a imitar: <ruta> — <por qué>
- Documentación externa: <URL> — <sección>
- Trampas conocidas: <...>

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear / modificar | <ruta> | <...> |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. <tarea> — <archivo>
2. <...>

## Validación
1. `make verify` (ESLint, Prettier `--check`, `tsc --noEmit`, Vitest). Si hay SQL: `make test-db` (pgTAP con `supabase test db`; requiere Docker Desktop y `supabase start`). Si hay cambios en la APK: `make apk`.
2. Pruebas a crear: <caso feliz, error, borde> — Vitest en `src/**/*.test.ts(x)` y `supabase/functions/**/*.test.ts`; pgTAP en `supabase/tests/*.test.sql`.
3. Prueba manual: <pasos y resultado esperado>

4. Pasar el PRP, `docs/contratos.md`, el diff y los resultados al subagente `reviewer`. Registrar el traspaso en `docs/traspasos/CU-XX-<responsable>.md`.

## Fuera de alcance
- <...>

## Notas / riesgos
- <...>
