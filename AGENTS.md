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
| Núcleo (Fase 0): `src/app/`, `src/compartido/`, `android/`, configuración raíz, migraciones `0001–0099` | Cristopher | revisor del PR |
| Módulo A: `src/acceso/`, `src/admin/`, `src/borradores/`, `src/publicacion/`, `supabase/functions/procesar-producto/`, `supabase/functions/_compartido/`, migraciones `0101–0199` | Persona A (`docs/modulos.md`) | revisor del PR |
| Módulo B: `src/vitrina/`, `supabase/seed.sql`, `supabase/seed/`, `infra/`, migraciones `0201–0299` | Persona B | revisor del PR |
| Módulo C: `src/pedidos/`, `supabase/functions/traducir-mensaje/`, migraciones `0301–0399` | Persona C | revisor del PR |
| pruebas (`*.test.ts(x)`, `supabase/tests/`) | autor del PRP | revisor del PR |

Regla: nadie edita un archivo ajeno sin avisar a su responsable. Los agentes no
modifican archivos fuera del PRP aunque parezca "una mejora rápida".

## 3. Contratos compartidos

- Fuente única: `docs/contratos.md` (API, eventos, esquemas, nombres de entidades del glosario).
- Cambiar un contrato requiere: PR propio, aviso a todo el equipo y entrada en `docs/cambios/`.
- Los nombres del dominio salen de `docs/dominio.md`; no inventar sinónimos en el código.
- **Base de datos en 3FN como mínimo:** sin datos derivados ni dependencias transitivas; `jsonb` solo para objetos
  de valor que se escriben y leen completos (detalle en `docs/contratos.md`).
- **Datos de prueba solo en `supabase/seed.sql`.** Prohibido escribirlos en el código de la app o en este archivo.

## 4. Calidad

- `make verify` debe pasar antes de abrir PR. Hasta implementar el PRP 000 falla a propósito:
  no se declara "verde" algo que no se ejecutó.
- **SDD:** se escribe el PRP y se ajustan los contratos antes del código; el agente no inventa campos, rutas ni
  dependencias fuera de ellos.
- **TDD en la lógica dura** (costeo, validaciones, esquemas de la IA, transiciones en SQL): primero la prueba que
  falla, luego el código mínimo que la pasa, luego el refactor. La prueba manual queda para la UX y el hardware
  (APK en un Android real).
- Cada PRP incluye criterios de aceptación comprobables y sus pruebas.
- No desactivar lint, tipos ni tests para "pasar". No dejar código muerto ni `TODO` sin dueño.
- Toda PR pasa por revisión: una persona del equipo + revisor IA con el prompt de `.claude/agents/reviewer.md` (ver §6).

## 5. Seguridad

- Nunca commitear `.env`, llaves, tokens ni credenciales. Solo `.env.example` con nombres sin valores.
- No pegar secretos en prompts, PRP, issues ni logs.
- No desplegar ni acceder a servidores/VPS sin autorización explícita del equipo para ese paso.
- Validar toda entrada externa; no confiar en datos del cliente. Estados, precios y totales solo cambian por RPC
  de Postgres o Edge Functions, protegidos con RLS; nunca desde el frontend.
- **IA y prompt injection:** el texto o audio del usuario va delimitado y se trata como dato, nunca como
  instrucción; la salida se valida contra su esquema y se muestra como texto plano. La IA no publica ni cambia
  estados por su cuenta.
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

- Las skills existen en dos copias idénticas, en `.agents/skills/` y `.claude/skills/`: `prp-manager` y, para
  la interfaz, `frontend-design`, `impeccable` y `taste-skill` (CC-10). Si cambias una, aplica el mismo cambio
  en la otra en el mismo commit. No activar los hooks de `impeccable` sin aprobación del responsable de `.claude/`.
- El prompt del revisor tiene una sola fuente: `.claude/agents/reviewer.md`. Si tu herramienta
  no tiene subagentes, abre una sesión nueva sin permisos de escritura y pásale ese archivo
  junto con PRP, contratos, diff y salida de `make verify`.
- Servidores MCP del proyecto: `.mcp.json` (`chrome-devtools`, `context7`, `supabase-local`), sin credenciales y
  con versión fija (CC-10). Nunca escribir tokens en ese archivo.
- No agregar archivos de reglas propios de una herramienta (`.cursor/rules`, `GEMINI.md`,
  `.agents/rules/`, etc.) que dupliquen este archivo.

## 7. Commits

- Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`; ámbito opcional `feat(cu-03): ...`.
- Sin atribución de IA de ninguna herramienta: prohibido `Co-Authored-By` de asistentes,
  "Generated with ..." o firmas equivalentes. Desactívalas en la configuración de tu herramienta.
- Commits pequeños y coherentes; el mensaje explica el porqué.
- Al entregar una versión: entrada en `CHANGELOG.md`.
