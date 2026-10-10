# AGENTS.md — Reglas para agentes y personas

Hackatón de 24 h · 5 personas · Claude Code + PRP.
Producto: **Ayllu**. Stack: React + TypeScript + Vite (web) y Capacitor (APK Android), Supabase self-hosted y proxy de IA LiteLLM (ver `docs/decisiones/0001` a `0004` y `docs/plan.md`).

## 1. Alcance por PRP

- Todo cambio de producto nace de un PRP en `docs/prp/NNN--nombre.md`, creado desde
  `docs/prp/_plantilla.md` (única plantilla) y vinculado a un caso de uso `CU-XX` de `docs/plan.md`.
- Un PRP = una rama = un PR. Rama: `cu-XX/nombre-corto`.
- El agente solo toca los archivos listados en la sección "Archivos" del PRP.
  Si necesita otro, se detiene y lo pide al responsable del PRP.
- Cambios de alcance tras aprobar el plan: registrar `docs/cambios/CC-XX.md` antes de implementarlos.
- Decisiones con alternativas: `docs/decisiones/NNNN-titulo.md`.

## 2. Responsables

Equipo: Cristopher, Chero, Luis, Marvin, Johann.

| Ruta / archivo | Responsable | Aprueba cambios |
| --- | --- | --- |
| `AGENTS.md`, `CLAUDE.md`, `Makefile`, `.claude/`, `.agents/`, `.gemini/`, `.opencode/` | <por asignar> | <por asignar> |
| `docs/proyecto.md`, `docs/dominio.md` | <por asignar> | <por asignar> |
| `docs/plan.md`, `docs/contratos.md` | <por asignar> | todo el equipo |
| `docs/prp/NNN--*.md` | responsable indicado en cada PRP | revisor del PR |
| `docs/entrega/` | <por asignar> | <por asignar> |
| `src/`, `android/`, `supabase/`, `infra/` | Cristopher | revisor del PR |
| pruebas (`*.test.ts(x)`, `supabase/tests/`) | autor del PRP | revisor del PR |

Regla: nadie edita un archivo ajeno sin avisar a su responsable. Los agentes no
modifican archivos fuera del PRP aunque parezca "una mejora rápida".

## 3. Contratos compartidos

- Fuente única: `docs/contratos.md` (API, eventos, esquemas, nombres de entidades del glosario).
- Cambiar un contrato requiere: PR propio, aviso a todo el equipo y entrada en `docs/cambios/`.
- Los nombres del dominio salen de `docs/dominio.md`; no inventar sinónimos en el código.

## 4. Calidad

- `make verify` debe pasar antes de abrir PR. Hasta implementar el PRP 000 falla a propósito:
  no se declara "verde" algo que no se ejecutó.
- Cada PRP incluye criterios de aceptación comprobables y sus pruebas.
- No desactivar lint, tipos ni tests para "pasar". No dejar código muerto ni `TODO` sin dueño.
- Toda PR pasa por revisión: una persona del equipo + revisor IA con el prompt de `.claude/agents/reviewer.md` (ver §6).

## 5. Seguridad

- Nunca commitear `.env`, llaves, tokens ni credenciales. Solo `.env.example` con nombres sin valores.
- No pegar secretos en prompts, PRP, issues ni logs.
- No desplegar ni acceder a servidores/VPS sin autorización explícita del equipo para ese paso.
- Validar toda entrada externa; no confiar en datos del cliente.
- Dependencias nuevas: justificar en el PR (motivo, licencia, mantenimiento).

## 6. Herramientas de IA

Estas reglas valen igual para cualquier asistente (Claude Code, Codex, Gemini CLI,
Antigravity, Cursor, OpenCode, Windsurf/Devin).

| Herramienta | Instrucciones | Skill `prp-manager` | Revisor |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md` → importa este archivo | `.claude/skills/` | subagente `reviewer` |
| Codex, Antigravity, Cursor | `AGENTS.md` (nativo) | `.agents/skills/` | prompt de `.claude/agents/reviewer.md` |
| Gemini CLI | `AGENTS.md` vía `.gemini/settings.json` | `.agents/skills/` | prompt de `.claude/agents/reviewer.md` |
| OpenCode | `AGENTS.md` (nativo) | `.agents/skills/` o `.claude/skills/` | subagente `.opencode/agents/reviewer.md` |
| Windsurf/Devin | `AGENTS.md` (nativo) | sin soporte documentado: leer `.agents/skills/prp-manager/SKILL.md` a mano | prompt de `.claude/agents/reviewer.md` |

- La skill existe en dos copias idénticas: `.agents/skills/prp-manager` y `.claude/skills/prp-manager`.
  Si cambias una, aplica el mismo cambio en la otra en el mismo commit.
- El prompt del revisor tiene una sola fuente: `.claude/agents/reviewer.md`. Si tu herramienta
  no tiene subagentes, abre una sesión nueva sin permisos de escritura y pásale ese archivo
  junto con PRP, contratos, diff y salida de `make verify`.
- No agregar archivos de reglas propios de una herramienta (`.cursor/rules`, `GEMINI.md`,
  `.agents/rules/`, etc.) que dupliquen este archivo.

## 7. Commits

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`; ámbito opcional `feat(cu-03): ...`.
- Sin atribución de IA de ninguna herramienta: prohibido `Co-Authored-By` de asistentes,
  "Generated with ..." o firmas equivalentes. Desactívalas en la configuración de tu herramienta.
- Commits pequeños y coherentes; el mensaje explica el porqué.
- Al entregar una versión: entrada en `CHANGELOG.md`.
