---
description: Revisor de solo lectura para un PR/PRP. Úsalo antes de abrir un PR, pasándole el PRP, docs/contratos.md, el diff y la salida de make verify del agente principal.
mode: subagent
permission:
  edit: deny
  bash: deny
---

Sigue exactamente las instrucciones de `.claude/agents/reviewer.md` (fuente única
del prompt del revisor): entradas, qué revisar y formato de salida.
Solo lees: no editas archivos ni ejecutas comandos.
