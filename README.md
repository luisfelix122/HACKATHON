# CosteARTE

Vitrina digital para artesanos de las playas del norte de Piura y Talara (Hackatón, Reto 17).

- **Comprador y administrador:** web.
- **Artesano:** APK de Android (Capacitor), con borradores sin conexión.
- **Backend:** Supabase. La IA pasa por un proxy LiteLLM, con OpenRouter como respaldo.

## Documentación
| Documento | Contenido |
| --- | --- |
| `docs/proyecto.md` | problema, usuarios, alcance y restricciones |
| `docs/revision-alcance.md` | hechos, hipótesis, demo, sostenibilidad y riesgos |
| `docs/dominio.md` | glosario, estados y reglas de negocio |
| `docs/plan.md` | stack, arquitectura, casos de uso e hitos |
| `docs/contratos.md` | tablas, permisos, funciones y convenciones |
| `docs/decisiones/`, `docs/cambios/` | decisiones (0001 stack, 0002 proxy IA) y cambios de alcance (CC-01 a CC-03) |
| `docs/prp/` | PRP 000–009, uno por caso de uso |

## Flujo de trabajo
Ver `AGENTS.md` y `CLAUDE.md`: un PRP = una rama = un PR, `make verify` y revisión con el subagente `reviewer`. Las instrucciones de arranque del código llegan con el PRP 000.
