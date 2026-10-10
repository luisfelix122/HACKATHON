# DESIGN — Ayllu

Sistema construido en el PRP 011 (decisión `docs/decisiones/0004-sistema-visual.md`). Describe lo que existe en `src/compartido/ui/`; si el código cambia, este archivo se actualiza.

## Mundo
**Guía de encomienda en la costa de Piura.**
- Cada pieza se muestra como una **etiqueta colgante** de arena seca, con ojal y pabilo.
- La confianza es un **sello de goma** circular: «RNA verificado».
- Lo que llena el artesano son **casillas numeradas**, como las de una guía de envío.
- El azul del Pacífico es el campo de color de la marca (barra superior, banda de la ruta) y el sol marca la acción principal de cada pantalla.

## Color («Mar de Cabo Blanco»)
| Token | Valor | Uso |
| --- | --- | --- |
| `--espuma` | `#F5FAFA` | fondo de página |
| `--pacifico` | `#0B4F6C` | barra, banda de la ruta, botón primario, sello, foco |
| `--pacifico-hondo` | `#083A50` | estado hover del primario, rótulo del lugar |
| `--ola` / `--ola-clara` | `#1A9E97` / `#DFF2F0` | éxito, avisos informativos, anillo de foco de los campos |
| `--arena` / `--arena-clara` | `#E3C98F` / `#F3E8CF` | etiqueta de pieza (solo fondo, nunca texto) |
| `--sol` / `--sol-claro` | `#F2B705` / `#FDF1C9` | botón destacado (uno por pantalla), selección de texto, alertas |
| `--noche` / `--noche-suave` | `#0A2533` / `#3C5866` | texto principal y secundario |
| `--error` / `--error-claro` | `#B42318` / `#FDE8E6` | errores |

**Estrategia:** contenida, con un campo comprometido. La página es clara para leer al sol; el azul ocupa regiones completas, no acentos sueltos.

## Tipografía
- **Atkinson Hyperlegible** (400 y 700), empaquetada con `@fontsource`: todo el texto y los controles. Base de 18 px.
- **Barlow Condensed** (600 y 700): solo en el logotipo, el sello, el número de casilla y los rótulos de lugar (en mayúsculas). Nunca para párrafos.
- Escala: `--tam-chico` 16 px, base 18 px, h3 21,6 px, h2 26 px, h1 33,6 px; la portada usa `clamp` hasta 4,2 rem. Tracking de títulos -0,02 em (portada -0,03 em).

## Componentes (`src/compartido/ui/componentes.tsx`)
| Componente | Regla |
| --- | --- |
| `Boton` | `primario` (azul), `secundario` (contorno), `destacado` (sol, uno por pantalla). Mínimo 48 px. Cuando está `cargando`, queda deshabilitado con `aria-busy` |
| `Campo` | La etiqueta va arriba y en negrita. La ayuda o el error van debajo, unidos con `aria-describedby`; el error marca `aria-invalid` y el borde rojo |
| `Casilla` | Número grande en Barlow Condensed y borde azul. Agrupa los campos de un paso; solo se usa cuando el orden importa |
| `Aviso` | `info`, `exito`, `alerta`, `error` (`role="alert"`) y `sin-senal` (azul noche). Cada uno con su ícono SVG propio, de trazo 2 |
| `Etiqueta` | Pieza: lugar en rótulo, título, «Hecho por…», precio opcional. Forma colgante con las esquinas superiores cortadas y el ojal centrado |
| `SelloRna` | `aprobada`: tinta azul con doble anillo, girado -8°, animación «sellar» de 240 ms. `pendiente`: punteado y gris |
| `Logotipo` | «Ayll» en blanco y la «u» final en sol, en Barlow Condensed. Es provisional: todavía no hay logo |

## Composición
- **Web:**
  - Barra azul con el logotipo y la navegación.
  - Portada en dos columnas desde 860 px: título grande y acciones a la izquierda, etiqueta de ejemplo colgando con su sello a la derecha.
  - Banda azul con «La ruta de la costa»: las caletas de norte a sur, unidas por tramos punteados de arena.
- **APK:** barra azul con el logotipo y una columna; un paso por pantalla.
- Ancho máximo de 1180 px; márgenes de 16 px en celular y 32 px en escritorio. Los párrafos tienen como máximo 68 caracteres de ancho.

## Movimiento
Solo como respuesta: el sello al aparecer (240 ms) y el hover y la pulsación de los botones (180 ms, `cubic-bezier(0.16, 1, 0.3, 1)`). Con `prefers-reduced-motion` todo se desactiva.

## Accesibilidad
- Contraste AA o más: `--noche` sobre `--espuma` y blanco sobre `--pacifico`.
- Foco visible: contorno azul de 3 px con separación.
- Objetivos táctiles de 48 px.
- Los errores se anuncian.

## No hacer
- Arena o sol como color de texto.
- Barlow Condensed en párrafos.
- Más de un botón destacado por pantalla.
- Tarjetas idénticas como estructura de página.
- Etiquetas o «eyebrows» en mayúsculas sobre los títulos: el rótulo de lugar es un dato, no decoración.
