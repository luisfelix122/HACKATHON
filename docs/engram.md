# Engram — Memoria del proyecto por MCP y Git

Engram 3.3.2 sirve las herramientas MCP y comparte únicamente memoria del proyecto `hackathon`. La base SQLite está aislada en `.engram/local/` y no se sube al repo.

## Arranque

1. Instala [Engram 3.3.2](https://github.com/Gentleman-Programming/engram/releases/tag/v3.3.2) y verifica el SHA-256 del archivo con `checksums.txt`. En Windows coloca `engram.exe` en `%USERPROFILE%/.local/bin/`; en macOS/Linux instala la misma versión en el PATH. Node.js 22 ya es requisito de Ayllu.
2. Desde la raíz del repo, recupera la memoria compartida:

   ```bash
   node scripts/engram.mjs import
   node scripts/engram.mjs status
   ```

3. Reinicia la sesión del agente para cargar MCP. Claude Code usa `.mcp.json`; Codex usa `.codex/config.toml` cuando confía en el proyecto. Confirma que aparecen `mem_context`, `mem_search` y `mem_save` antes de asumir que están activos.

El wrapper usa rutas del checkout, fuerza `hackathon` y exige la versión indicada. En Windows da prioridad a `.local/bin/engram.exe` para no elegir un ejecutable antiguo de Go. El MCP se sirve por stdio, sin puerto ni token; no se configura Engram Cloud.

## Compartir memoria

```bash
node scripts/engram.mjs export
node scripts/engram.mjs status
```

El export genera un chunk comprimido y actualiza `.engram/manifest.json`; no hace push. Revisa el contenido descomprimido de los chunks nuevos antes de agregarlos a Git. Comparte decisiones, correcciones y traspasos útiles del proyecto, sin secretos ni conversaciones privadas. Nunca uses `sync --all` para este repo.

Tras traer commits del equipo, ejecuta `import` otra vez. Los chunks se importan una sola vez; el manifiesto permite recuperar la memoria en un clon nuevo. Cada clon mantiene su propia base local.

## Archivos compartidos y locales

| Archivo | Tratamiento |
| --- | --- |
| `.engram/config.json` | Identidad `hackathon`, igual al export existente |
| `.engram/manifest.json`, `.engram/chunks/*.jsonl.gz` | Versionados, tras revisar el contenido |
| `.engram/local/`, `.engram/*.db*`, logs | Ignorados por Git |
| `.mcp.json`, `.codex/config.toml`, `scripts/engram.mjs` | Configuración portable, sin credenciales |

Las memorias antiguas son contexto histórico, no autoridad sobre el estado actual: por ejemplo, CC-12 reemplazó OpenRouter por LiteLLM y Gemini directo. Contratos, PRP y decisiones vigentes del repo siguen siendo la fuente de verdad.

Fuentes: [Git Sync de Engram](https://github.com/Gentleman-Programming/engram/blob/main/DOCS.md#git-sync-chunked), [configuración MCP de Engram](https://github.com/Gentleman-Programming/engram/blob/main/docs/AGENT-SETUP.md) y [configuración MCP de Codex](https://developers.openai.com/codex/mcp).
