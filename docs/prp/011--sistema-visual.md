# PRP 011 — Sistema visual y rediseño de las pantallas existentes

- Caso de uso: CU-11 (transversal; aplica a CU-01 y sirve de base a CU-02 a CU-07)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (ajustado en CC-10). Se ejecuta después del PRP 001. Implementación anterior en la etiqueta `respaldo-implementacion`
- Rama: `cu-11/sistema-visual`

## Objetivo
Aplicar la decisión `0004` como un sistema reutilizable y rediseñar las pantallas que ya existen:
- **Web:** inicio, ingreso del comprador y panel de administración (la web no tiene registro de artesanos, CC-08).
- **APK:** ingreso, registro con correo o Google, «Tu cuenta» y «Mis productos».

## Por qué
La marca parte de cero; sin un sistema común, cada PRP inventaría su propio estilo.

## Criterios de aceptación
- [ ] Tokens CSS (color, tipografía, espacio, radios y estados) en `src/compartido/ui/tokens.css`, con la paleta de `0004`.
- [ ] Componentes `Boton`, `Campo`, `Etiqueta`, `SelloRna`, `Aviso` y `Casilla` en `src/compartido/ui/`, con sus estados por defecto, foco visible, deshabilitado, cargando y error.
- [ ] Fuentes empaquetadas con `@fontsource`. Nada se carga desde un CDN, así que la APK abre sin conexión con sus fuentes.
- [ ] Las pantallas existentes usan los componentes. No se cambia ninguna regla ni contrato de CU-01.
- [ ] Contraste AA en todo texto. Objetivos táctiles de al menos 48 px. Texto base de 18 px en la APK. `prefers-reduced-motion` respetado.
- [ ] Se ven bien entre 360 px y 1440 px. Capturas de escritorio y celular adjuntas al PR (no se commitean).
- [ ] `make verify` y `make build` en verde. Revisión del subagente `reviewer`.
- [ ] `DESIGN.md` actualizado al final, desde lo construido.

## Contexto necesario
- **Decisiones:** `0004-sistema-visual.md`; `PRODUCT.md`.
- **Código existente a imitar:** `src/compartido/ui/estilos.css`, que se reemplaza; pantallas de `src/acceso/`, `src/admin/` y `src/app/`.
- **Documentación externa:**
  - https://fontsource.org/fonts/atkinson-hyperlegible
  - https://fontsource.org/fonts/barlow-condensed
- **Trampas conocidas:**
  - El arena seca (`#E3C98F`) y el sol (`#F2B705`) no sirven como color de texto sobre blanco: solo como fondo de campos, con texto azul noche encima.
  - No usar Barlow Condensed para leer: solo en el sello y el número de casilla.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `src/compartido/ui/tokens.css` | tokens |
| modificar | `src/compartido/ui/estilos.css` | base y utilidades con los tokens |
| crear | `src/compartido/ui/componentes.tsx`, `src/compartido/ui/componentes.test.tsx` | Boton, Campo, Etiqueta, SelloRna, Aviso, Casilla |
| modificar | `src/main.tsx` | importar las fuentes y los tokens |
| modificar | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx`, `src/acceso/*.tsx`, `src/admin/PanelAcreditacion.tsx` | usar los componentes; sin cambios de lógica |
| modificar | `package.json`, `package-lock.json` | `@fontsource/atkinson-hyperlegible`, `@fontsource/barlow-condensed` (OFL-1.1) |
| modificar | `DESIGN.md` | sistema documentado desde lo construido (`PRODUCT.md` y la decisión `0004` ya existen y no se tocan) |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Validación
1. `make verify` y `make build`.
2. **Pruebas a crear:** componentes con su estado de error y deshabilitado, y su accesibilidad (etiqueta asociada al campo, `role="status"` en el aviso).
3. **Prueba manual:** capturas en 390 px y 1280 px de la vitrina y del panel en la web, y del registro y el ingreso en la APK.

## Fuera de alcance
- Pantallas de los PRP 002 a 007: heredan el sistema cuando se construyen.
- Logo final: se usa un logotipo tipográfico provisional.
