# Ayllu

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
| `docs/decisiones/`, `docs/cambios/` | decisiones (0001 a 0004) y cambios de alcance (CC-01 a CC-08) |
| `docs/prp/` | PRP 000–011, uno por caso de uso |
| `PRODUCT.md`, `DESIGN.md` | datos del producto y sistema visual (skill impeccable) |
| `docs/traspasos/estado-general.md` | estado actual y siguiente paso |

## Estado
Aún no hay código: cada PRP se implementa uno por uno, empezando por el PRP 000 (base web + APK). Una implementación anterior de los PRP 000, 001 y 011 quedó guardada en la etiqueta de git `respaldo-implementacion` como referencia; para recuperar un archivo: `git checkout respaldo-implementacion -- <ruta>`.

Las instrucciones de arranque (requisitos, variables y comandos) se escriben al implementar el PRP 000. Dato ya comprobado: para compilar la APK con Capacitor 8 hace falta **JDK 21**, porque el JDK 25 de Android Studio no funciona con su Gradle.

## Flujo de trabajo
Ver `AGENTS.md` y `CLAUDE.md`: un PRP = una rama = un PR, `make verify` y revisión con el subagente `reviewer`.
