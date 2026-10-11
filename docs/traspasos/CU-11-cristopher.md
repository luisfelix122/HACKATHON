# Traspaso CU-11 — Sistema visual (PRP 011)

- **Responsable:** Cristopher
- **Rama:** `cu-11/sistema-visual`, desde `main` en `47eef21` (PRP 000 y su seguimiento ya integrados)
- **PRP:** `docs/prp/011--sistema-visual.md`
- **Dependencias integradas:** PRP 000
- **Fecha:** 2026-10-10

## Archivos
| Acción | Ruta |
| --- | --- |
| crear | `src/compartido/ui/tokens.css`, `src/compartido/ui/componentes.tsx`, `src/compartido/ui/componentes.test.tsx` |
| modificar | `src/compartido/ui/estilos.css`, `src/main.tsx`, `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx` |
| modificar | `package.json`, `package-lock.json` (`@fontsource/atkinson-hyperlegible`, `@fontsource/barlow-condensed`, OFL-1.1) |
| modificar | `DESIGN.md` |
| modificar, **fuera de la tabla, aprobado** | `vite.config.ts`: `test.css.include` para leer `tokens.css` en las pruebas. Lo aprobó Cristopher en el chat el 2026-10-10 |
| crear | `docs/traspasos/CU-11-cristopher.md` (este archivo) |

## Decisiones
- **Contraste comprobado por prueba:** la prueba lee los valores reales de `tokens.css`. Vitest devuelve vacío el CSS importado, por eso se cambió `vite.config.ts`. Una prueba de mutación (aclarar `--noche-suave`) confirmó que la prueba falla cuando el color no alcanza el contraste.
- **Barlow Condensed:** solo en el sello y en el número de casilla, como dice la decisión 0004. El `DESIGN.md` anterior también la usaba en el logotipo y en el lugar de la etiqueta; el revisor lo detectó y se corrigió.
- **Sin datos de ejemplo en las pantallas:** la portada no muestra una etiqueta de ejemplo ni la banda de caletas, porque `AGENTS.md` §3 prohíbe datos de prueba en el código de la app. Las construye el PRP 004 con `supabase/seed.sql`.
- **`app.test.tsx` sin tocar:** no está en la tabla del PRP. Por eso se mantienen el `h1` «Ayllu» y el texto «Aún no tienes productos. Toca Nuevo.».
- **`Casilla` con título:** recibe un `titulo` y se anuncia como el grupo «Paso N: título».

## Pruebas y resultados
| Comprobación | Resultado |
| --- | --- |
| `make verify` | exit 0; 49 pruebas: 12 de `app.test.tsx` y 37 de componentes y contraste |
| `make build` | exit 0; la APK sigue sin la web y la web sin la APK |
| `make apk` | BUILD SUCCESSFUL; 10 `.woff2` dentro de `assets/public/assets`, sin CDN |
| Revisión visual con el navegador integrado | web a 390 y 1280 px y APK a 390 px: sin scroll horizontal, base de 18 px, botón de 48 px, fuentes locales cargadas |
| Hover de un enlace como botón primario | texto blanco sobre azul; antes del arreglo quedaba invisible |
| Revisión del subagente `reviewer` | 2 ciclos. Ciclo 1: «cambios requeridos» (hover y Barlow, más 5 menores). Ciclo 2: «aprobar» |

## Pruebas manuales pendientes
- [ ] Revisar las pantallas con TalkBack en el Android.
- [ ] Adjuntar al PR las capturas de escritorio y de celular. Están en el scratchpad de la sesión y no se commitean.

## Siguiente paso
- PRP 012 (`cu-12/esquema-base`), con el PRP 011 en `main`.
