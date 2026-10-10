@AGENTS.md

# CLAUDE.md

## Documentos
- Problema y alcance: `docs/proyecto.md`
- Glosario y reglas de negocio: `docs/dominio.md`
- Plan, casos de uso e hitos: `docs/plan.md`
- Contratos compartidos: `docs/contratos.md`
- Decisiones: `docs/decisiones/` · Cambios de alcance: `docs/cambios/`
- PRP: `docs/prp/` (plantilla única `docs/prp/_plantilla.md`)
- Entrega: `docs/entrega/` · Versiones: `CHANGELOG.md`

## Comandos
- `make help` — lista objetivos.
- `make verify` — lint + formato + tipos + tests. Hoy falla: stack sin definir (ver `Makefile`).

## Flujo con Claude Code
1. Generar PRP con la skill `prp-manager` (`.claude/skills/prp-manager`) a partir de un `CU-XX`.
2. Ejecutar el PRP solo sobre los archivos que declara.
3. `make verify`.
4. Pasar PRP, `docs/contratos.md`, diff y salida de `make verify` al subagente `reviewer`.
5. Abrir PR con `.github/pull_request_template.md`.

No hay código ni carpetas de tests todavía: se crean al fijar el stack.
