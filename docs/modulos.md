# Módulos para implementar en paralelo (CC-11)

Tres personas implementan sus PRP al mismo tiempo, cada una en su laptop y su sesión de Claude Code, **sin modificar el mismo archivo**. Para lograrlo, primero una persona deja en `main` la **Fase 0**, con todo lo compartido. Después, cada módulo solo escribe en sus carpetas.

## Resumen

| Fase / módulo | Persona | PRP, en orden | Escribe solo en |
| --- | --- | --- | --- |
| **Fase 0 — Núcleo** | Cristopher | 000 → 011 → 012 | raíz del proyecto, `src/app/`, `src/compartido/`, `android/`, migraciones `0001–0099` |
| **A — Artesano** (APK y admin) | Persona A: <nombre> | 001 → 002 → 003 | `src/acceso/`, `src/admin/`, `src/borradores/`, `src/publicacion/`, `supabase/functions/procesar-producto/`, `supabase/functions/_compartido/`, migraciones `0101–0199` |
| **B — Vitrina e infraestructura** | Persona B: <nombre> | 004 → 007, y 010 → 009 | `src/vitrina/`, `supabase/seed.sql`, `supabase/seed/`, `infra/`, `README.md`, migraciones `0201–0299` |
| **C — Pedidos** | Persona C: <nombre> | 005 → 006 → 008 | `src/pedidos/`, `supabase/functions/traducir-mensaje/`, migraciones `0301–0399` |

Cristopher puede ser también la Persona A cuando termine la Fase 0.

**Cuándo arrancan los módulos:** A, B y C empiezan cuando el PR del PRP 012 está en `main`. Antes de eso, los tres archivos de costura no existen y las migraciones de los módulos no tienen tablas sobre las que correr.

## Reglas para no cruzarse

1. **Congelado tras la Fase 0:** `src/app/`, `src/compartido/`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `Makefile`, `.github/`, `android/` y las migraciones `0001–0099`. Si un módulo necesita cambiar algo ahí, se detiene y lo pide a Cristopher, que lo hace en un PR propio y avisa a los tres.
2. **Rutas:** cada módulo declara sus rutas y su menú en su `src/<carpeta>/rutas.tsx`. Nunca edita `AppWeb.tsx` ni `AppArtesano.tsx`.
3. **Estilos:** cada módulo crea su CSS en su carpeta (por ejemplo, `src/vitrina/vitrina.css`) y usa los tokens y componentes de `src/compartido/ui/`. No edita `estilos.css`.
4. **Migraciones:** cada módulo numera en su bloque y solo depende del núcleo (0001–0003). Las pruebas pgTAP van con un nombre propio en `supabase/tests/`.
5. **Dependencias:** ya están todas instaladas en la Fase 0. Una dependencia nueva es un cambio congelado (regla 1).
6. **Contratos:** `docs/contratos.md` solo cambia con un PR propio, aviso a todo el equipo y un registro en `docs/cambios/` (`AGENTS.md` §3).
7. **Traspasos:** `docs/traspasos/CU-XX-<responsable>.md`, uno por PRP; nunca se comparte un archivo.
8. **Un PRP = una rama = un PR.** El siguiente PRP del mismo módulo parte de `main` cuando el anterior ya está integrado. Si todavía no lo está, se apila sobre la rama anterior del mismo módulo, nunca sobre la de otro módulo.

## Dependencias entre módulos

Por diseño, solo quedan dos, y ninguna obliga a tocar archivos ajenos:

| Quién | Usa | De | Cómo |
| --- | --- | --- | --- |
| B (PRP 004, `FichaProducto`) | `BotonPedir` | C | Lo importa desde `src/pedidos/BotonPedir.tsx`. Hasta que C lo implemente, se ve el stub deshabilitado de la Fase 0 |
| C (PRP 008, opcional) | `supabase/functions/_compartido/ia.ts` | A (PRP 003) | Solo lo importa, sin modificarlo. El PRP 008 empieza después de que el PRP 003 esté en `main` |

**Pruebas de punta a punta entre módulos** (por ejemplo, que el artesano real vea un pedido en la APK): cada módulo las deja como prueba manual pendiente en su traspaso. Se hacen al integrar, con los datos de `supabase/seed.sql`.

## Prompt del Paso 4 por PRP

Cada persona usa el prompt del Paso 4 tal cual y solo reemplaza estas líneas. Antes:

```bash
git switch main
git pull --ff-only
git switch -c <rama>
```

### Fase 0 — Cristopher
| PRP | Rama | Archivos propios | Dependencias integradas |
| --- | --- | --- | --- |
| `docs/prp/000--base-web-apk.md` | `cu-00/base-web-apk` | tabla «Archivos» del PRP 000 | ninguna |
| `docs/prp/011--sistema-visual.md` | `cu-11/sistema-visual` | tabla «Archivos» del PRP 011 | PRP 000 en `main` |
| `docs/prp/012--esquema-base-y-costuras.md` | `cu-12/esquema-base` | tabla «Archivos» del PRP 012 | PRP 000 y 011 en `main` |

### Módulo A — Artesano
| PRP | Rama | Archivos propios | Dependencias integradas |
| --- | --- | --- | --- |
| `docs/prp/001--acceso-y-acreditacion.md` | `cu-01/acceso-acreditacion` | `src/acceso/**`, `src/admin/**`, `supabase/migrations/0101_resolver_acreditacion.sql`, `supabase/tests/acreditacion.test.sql` | Fase 0 (PRP 012) en `main` |
| `docs/prp/002--borrador-sin-conexion.md` | `cu-02/borrador-sin-conexion` | `src/borradores/**` | PRP 001 en `main` |
| `docs/prp/003--ia-y-publicacion.md` | `cu-03/ia-publicacion` | `src/publicacion/**`, `supabase/functions/procesar-producto/**`, `supabase/functions/_compartido/**`, `supabase/migrations/0102_producto_ia.sql`, `supabase/tests/producto_ia.test.sql` | PRP 002 en `main` |

### Módulo B — Vitrina e infraestructura
| PRP | Rama | Archivos propios | Dependencias integradas |
| --- | --- | --- | --- |
| `docs/prp/004--vitrina-publica.md` | `cu-04/vitrina` | `src/vitrina/**`, `supabase/migrations/0201_vitrina.sql`, `supabase/tests/vitrina.test.sql`, `supabase/seed.sql` | Fase 0 (PRP 012) en `main` |
| `docs/prp/007--datos-semilla.md` | `cu-07/datos-semilla` | `supabase/seed.sql`, `supabase/seed/**` | PRP 004 en `main` |
| `docs/prp/010--supabase-autohospedado-y-web.md` | `cu-10/supabase-autohospedado` | `infra/supabase/**`, `infra/web/**`, `README.md`, `docs/traspasos/CU-10-*.md` | Fase 0 en `main`; el despliegue lo hace la laptop autorizada |
| `docs/prp/009--proxy-ia-litellm.md` | `cu-09/proxy-ia-litellm` | `infra/litellm/**`, `docs/traspasos/CU-09-*.md` | Fase 0 en `main`; el despliegue lo hace la laptop autorizada |

### Módulo C — Pedidos
| PRP | Rama | Archivos propios | Dependencias integradas |
| --- | --- | --- | --- |
| `docs/prp/005--pedido-y-despacho.md` | `cu-05/pedido-despacho` | `src/pedidos/**`, `supabase/migrations/0301_crear_orden.sql`, `supabase/tests/orden_crear.test.sql` | Fase 0 (PRP 012) en `main` |
| `docs/prp/006--confirmacion-pago-despacho.md` | `cu-06/confirmacion-pago` | `src/pedidos/**`, `supabase/migrations/0302_transiciones_orden.sql`, `supabase/tests/orden_transiciones.test.sql` | PRP 005 en `main` |
| `docs/prp/008--traduccion-hilo-orden.md` (opcional) | `cu-08/traduccion-hilo` | `src/pedidos/**`, `supabase/functions/traducir-mensaje/**` | PRP 006 y PRP 003 (módulo A) en `main` |

`GitHub autorizado:` lo indica cada persona para su propia sesión y su clon de `luisfelix122/HACKATHON`, o escribe «ninguno».

## Orden sugerido en el tiempo

```
Cristopher: 000 ─ 011 ─ 012 ─┬─ (Persona A) 001 ─ 002 ─ 003
                             ├─ Persona B:   004 ─ 007    y en paralelo 010 ─ 009
                             └─ Persona C:   005 ─ 006 ─ (008 cuando 003 esté en main)
```
