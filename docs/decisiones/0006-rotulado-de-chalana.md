# 0006 — Mundo visual «Rotulado de chalana»

- Fecha: 2026-10-11
- Estado: aceptada (reemplaza a `0004-sistema-visual.md`; CC-17 aprobado el 2026-10-11)
- Decide: Cristopher · Proceso: skills `impeccable` (dirección nueva, sorteo `9bfb688c`, modo Persuade) y `frontend-design`

## Contexto
El equipo pidió rediseñar toda la plataforma: web del comprador, panel del administrador y APK del artesano, con una landing que presente Ayllu, las artesanías, las caletas y los artesanos. La auditoría de las pantallas actuales (`docs/traspasos/CU-13-cristopher.md`, sección «Auditoría») encontró:
- La portada es el catálogo, sin una propuesta de valor ni accesos destacados.
- La barra de la APK mete tres enlaces junto al logotipo y se parte en dos líneas a 390 px.
- No hay iconos, ni un componente de modal, ni una navegación consistente.
- El mundo «Guía de encomienda» (0004) quedó en detalles (sello, casilla) que casi no se ven.

Cristopher eligió reemplazar el mundo en vez de evolucionarlo.

## Alternativas
| Opción | A favor | En contra |
| --- | --- | --- |
| **Rotulado de chalana** | Sale de los cascos pintados de los botes de Cabo Blanco, Los Órganos y Máncora, que compradores y artesanos ven a diario. El nombre de cada artesano se rotula como el nombre de un bote: «quién lo hizo» es el centro visual. | Es lo más cercano a lo que se espera de «costa peruana»; el rotulado puede caer en folclor si se exagera. |
| Calcomanía de tabla (la que asignó el sorteo) | Tiendas de surf de Lobitos; fuerte para el turista. | Aleja a artesanas que no surfean; la APK tendría que negarla. |
| Evolucionar 0004 | Menos riesgo para los módulos en curso. | Cristopher pidió reemplazar el mundo. |
| Estándar de marketplace | Cero riesgo. | Igual a cualquier tienda y depende de fotos que hoy no hay. |

## Decisión
**Mundo:** el casco pintado de una chalana.
- **Franjas de casco:** las regiones de la página son franjas horizontales a sangre (casco azul, borda roja, línea de flotación amarilla), no tarjetas flotando.
- **Rotulado:** los nombres propios (Ayllu, el título de cada pieza, el nombre del artesano y las caletas) van rotulados en **Bungee**, una tipografía de rótulos, con sombra dura desplazada, como la pintura a brocha.
- **Tablón:** cada pieza se muestra como un tablón pintado: superficie de cal, franja de color arriba y el nombre rotulado.
- **Matrícula:** la caleta se muestra como placa de matrícula; el sello «RNA verificado» es un emblema redondo pintado.
- **Lectura y controles:** Atkinson Hyperlegible, ya empaquetada, para todo lo que se lee y se toca.

**Paleta «Casco pintado»** (contraste comprobado):
| Token | Valor | Uso |
| --- | --- | --- |
| `--casco` / `--casco-hondo` | `#1F4E9C` / `#163A75` | franjas, botón primario, foco, enlaces |
| `--borda` / `--borda-honda` | `#D7263D` / `#B01E31` | franja de borda; errores en `--borda-honda` (6,35:1 sobre cal) |
| `--sol` | `#F2C14E` | botón destacado (uno por pantalla) y línea de flotación; nunca texto sobre claro |
| `--cal` / `--blanco` | `#F7F7F2` / `#FFFFFF` | fondo de página / superficies |
| `--brea` / `--brea-suave` | `#1E1E1E` / `#4A4A46` | texto principal (15,5:1) y secundario (8,3:1) |
| `--mar` | `#DCEBF2` | avisos y estados de información |

**Componentes nuevos:** `Icono` (juego propio de iconos de trazo grueso, siempre con etiqueta visible o accesible), `Modal` (sobre `<dialog>` nativo), `Franja`, `Tablon`, `Matricula` y `BarraPestanas` (APK). **Movimiento:** solo como respuesta (sellar, guardar, abrir un modal), de 150 a 250 ms, y respetando `prefers-reduced-motion`.

## Motivo
Cristopher eligió esta dirección en la página de decisión de impeccable, entre la asignada por el sorteo, seis retadores del catálogo y el estándar de la categoría. Los cascos pintados son de este lugar y de esta gente, y el nombre rotulado pone a la persona antes que el precio (principio 3 de `PRODUCT.md`).

## Consecuencias
- **Positivas:** una identidad propia y reconocible sin fotos (hoy solo hay 5 fotos con licencia), una navegación con iconos y etiquetas, y modales accesibles para formularios cortos.
- **Negativas / costos:**
  - Una dependencia nueva (`@fontsource/bungee`, OFL-1.1). Sale `@fontsource/barlow-condensed`.
  - Toca el CSS y la presentación de los seis módulos: requiere coordinar con los que están en desarrollo (CC-17).
  - Riesgo de folclor: el rotulado se limita a nombres propios y títulos, nunca a párrafos ni controles.
- **Qué cambia:** `src/compartido/ui/`, las cáscaras de `src/app/`, el CSS y el marcado de los módulos, `DESIGN.md` (se reescribe al terminar) y la decisión 0004, que queda reemplazada.

## Ajuste sobrio (2026-10-11)
Cristopher pidió un aspecto más profesional y menos caricaturizado, sin cambiar comportamiento ni contenido.
- **Tipografía:** sale Bungee (`@fontsource/bungee`); los nombres propios y los titulares usan **Fraunces** (`@fontsource-variable/fraunces`, OFL-1.1). Atkinson Hyperlegible sigue para leer y tocar.
- **Forma:** filetes de 1 px (`--linea`, `--linea-fuerte`) y sombras suaves en lugar de bordes de brocha y sombra dura; sin sombras en el texto, sin tablones girados ni juntas de tablas.
- **Paleta:** los mismos papeles con tonos apagados (`--casco` #1D3F5E, `--borda` #A8432C, `--sol` #E0B252, `--cal` #FAF8F4); el contraste AA se sigue comprobando en `componentes.test.tsx`.
- **Primera pantalla:** la proa pintada pasa a un horizonte con sol sobre el mar.
