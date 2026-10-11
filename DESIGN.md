# DESIGN — Ayllu

Sistema visual construido en el PRP 011 (decisión `docs/decisiones/0004-sistema-visual.md`). Vive en `src/compartido/ui/`:
- `tokens.css`: valores.
- `estilos.css`: base y componentes.
- `componentes.tsx`: React.

Este archivo describe lo que está construido. Si cambia el código, se actualiza aquí.

Los módulos no editan `src/compartido/ui/`. Crean su CSS en su carpeta y usan los tokens y los componentes (`docs/modulos.md`, regla 3).

## Mundo
**Guía de encomienda en la costa de Piura.**
- Cada pieza se muestra como una **etiqueta colgante** de arena seca, con ojal.
- La confianza es un **sello de goma** circular: «RNA verificado».
- Lo que llena el artesano son **casillas numeradas**, como las de una guía de envío, con un paso por casilla.
- El azul del Pacífico es el campo de color de la marca (la barra superior) y el sol marca la acción principal de cada pantalla.

## Color («Mar de Cabo Blanco»)
| Token | Valor | Uso |
| --- | --- | --- |
| `--espuma` | `#F5FAFA` | fondo de página; texto sobre `--noche` |
| `--blanco` | `#FFFFFF` | superficies (casilla, campo enfocado, botón secundario); texto sobre `--pacifico` |
| `--pacifico` | `#0B4F6C` | barra, botón primario, número de casilla, sello, foco, enlaces |
| `--pacifico-hondo` | `#083A50` | hover del primario y de los enlaces |
| `--ola` / `--ola-clara` | `#1A9E97` / `#DFF2F0` | avisos de información y éxito, anillo de foco de los campos |
| `--arena` / `--arena-clara` | `#E3C98F` / `#F3E8CF` | etiqueta de pieza y fondo de los campos (nunca texto) |
| `--sol` / `--sol-claro` | `#F2B705` / `#FDF1C9` | botón destacado (uno por pantalla), la «u» del logotipo, alertas, selección de texto (nunca texto sobre claro) |
| `--noche` / `--noche-suave` | `#0A2533` / `#3C5866` | texto principal y secundario |
| `--error` / `--error-claro` | `#B42318` / `#FDE8E6` | errores |

**Estrategia:** contenida, con un campo de color comprometido. La página es clara para leer al sol, y el azul ocupa regiones completas, no acentos sueltos.

**Contraste comprobado:** `componentes.test.tsx` lee los valores reales de `tokens.css` y exige 4,5:1 para cada pareja de texto que usan los componentes:
- `--noche` sobre espuma, blanco, arena, arena clara, sol, sol claro y ola clara.
- `--noche-suave` sobre espuma, blanco y arena (este último queda cerca del límite, unos 4,7:1).
- `--pacifico` sobre espuma, blanco, ola clara y arena.
- Blanco sobre los dos azules.
- `--sol` sobre `--pacifico` (la «u» del logotipo).
- `--error` sobre blanco, espuma y error claro.
- Espuma sobre noche.

Una pareja nueva de texto se agrega a esa prueba.

La misma prueba confirma que arena y sol **no** llegan a 4,5:1 sobre blanco. Si alguien cambia un color y rompe el contraste, `make verify` falla.

## Tipografía
- **Atkinson Hyperlegible** (400 y 700), empaquetada con `@fontsource`: todo el texto y los controles. Base de **18 px** (`--tam-base`) en la web y en la APK.
- **Barlow Condensed** (600 y 700): **solo** dentro del sello y en el número de casilla, como dice la decisión 0004. El logotipo y el lugar de la etiqueta usan Atkinson 700.
- **Escala:**
  - `--tam-chico`: 16 px.
  - `--tam-base`: 18 px.
  - `--tam-h3`: 21,6 px.
  - `--tam-h2`: 26 px.
  - `--tam-h1`: 33,6 px.
  - `--tam-portada`: `clamp(2.4rem, 1.6rem + 3.4vw, 4.2rem)`.
- **Títulos:** interlineado 1,12 y tracking -0,02 em; en la portada, -0,03 em.
- **Párrafos:** máximo 68 caracteres de ancho (`--ancho-lectura`).
- **Sin red:** las fuentes van dentro del build (`dist-*/assets/*.woff2`), sin CDN, así que la APK abre sin señal con su tipografía.

## Componentes (`src/compartido/ui/componentes.tsx`)
| Componente | Regla |
| --- | --- |
| `Boton` | **Variantes:** `primario` (azul, por defecto), `secundario` (contorno azul sobre blanco) y `destacado` (sol con texto noche, uno por pantalla). **Tamaño:** 48 px como mínimo; con `ancho` ocupa todo el ancho. **Tipo:** `type="button"` salvo que se indique otro. **Cargando:** queda deshabilitado, con `aria-busy` y un giro. **Deshabilitado:** borde punteado gris. |
| `Campo` | **Control:** se pasa como función hija y recibe `id`, `aria-invalid` y `aria-describedby`; sirve para input, select o textarea. **Etiqueta:** arriba y en negrita. **Ayuda o error:** debajo y unidos al control; si hay error, reemplaza a la ayuda, marca `aria-invalid` y pinta el borde y el fondo en rojo. **Fondo:** arena clara; al enfocarse pasa a blanco con anillo ola. Si hay error, mantiene el fondo rojo claro también al enfocarse. |
| `Casilla` | Grupo (`role="group"`) que los lectores anuncian como «Paso N: título». El título es un `h2`: la pantalla del paso tiene su `h1` y cada casilla cuelga de él. El número va grande en Barlow Condensed sobre azul y está oculto para lectores. Solo se usa cuando el orden importa. |
| `Aviso` | **Tonos:** `info` (por defecto), `exito`, `alerta`, `error` y `sin-senal` (fondo noche, texto espuma). Cada tono tiene su ícono SVG de trazo 2. **Rol:** `role="status"`; `error` usa `role="alert"` para anunciarse de inmediato. |
| `Etiqueta` | Pieza colgante en arena con las esquinas superiores cortadas, un ojal centrado y sombra. Muestra el lugar, el título (`h3`), «Hecho por…» y el precio opcional. El título es `h3` porque la etiqueta va dentro de una sección con `h2` (por ejemplo, la cuadrícula de la vitrina). Acepta contenido extra (por ejemplo, el sello). |
| `SelloRna` | **`aprobada`:** tinta azul con doble anillo, girado -8° y animación «sellar» de 240 ms; se lee «RNA verificado». **`pendiente`:** punteado y gris, sin animación; se lee «RNA en revisión». |
| `Logotipo` | «Ayll» en el color del texto y la «u» final en sol, en Atkinson 700. Es provisional: todavía no hay logo. En la web va dentro de un enlace al inicio. |

**Utilidades de `estilos.css`:**
- `.barra` / `.barra-contenido`: barra azul con el logotipo.
- `.pagina`: columna centrada, de 1180 px como máximo.
- `.pagina-artesano`: una columna de 40 rem, para la APK.
- `.portada` / `.portada-bajada`.
- `.texto-secundario`.
- `.solo-lectores`.

## Composición
- **Márgenes:** 16 px en el celular y 32 px desde 768 px (`--margen`). Sin desborde horizontal entre 360 y 1440 px.
- **Web (estado actual):** barra azul con el logotipo; portada con el título grande, la bajada y un aviso de vitrina vacía. Están las rutas `/`, `/producto/:id` y `/admin`, y una página «no encontrada» con un enlace con estilo de botón secundario.
- **APK (estado actual):** barra azul con el logotipo y una sola columna: «Mis productos» vacío.
- **Para los módulos:**
  - **Vitrina (PRP 004):** la etiqueta de ejemplo con su sello y la banda «La ruta de la costa» (caletas de norte a sur, unidas por tramos punteados de arena). Se construyen con los datos de `supabase/seed.sql`, porque el código de la app no lleva datos de prueba.
  - **Borradores (PRP 002):** un paso por pantalla, con `Casilla`.

## Movimiento
- **Solo como respuesta a una acción:**
  - El sello al aparecer: 240 ms (`--sellar`).
  - El hover y la pulsación de los botones: 180 ms (`--rapido`), con `cubic-bezier(0.16, 1, 0.3, 1)`.
  - El giro de «cargando».
- **`prefers-reduced-motion`:** anula animaciones y transiciones.

## Accesibilidad
- Contraste AA o más, comprobado por prueba (ver «Color»).
- **Foco visible:**
  - En general, contorno azul de 3 px con separación.
  - En la barra, contorno sol.
  - En los campos, anillo ola.
- Objetivos táctiles de 48 px (`--tactil`).
- Los errores se anuncian (`role="alert"`) y quedan unidos a su campo.
- La interfaz está en español (`<html lang="es">`).

## No hacer
- Usar arena o sol como color de texto sobre fondos claros.
- Usar Barlow Condensed en párrafos.
- Poner más de un botón destacado por pantalla.
- Usar tarjetas idénticas como estructura de página.
- Poner etiquetas o «eyebrows» en mayúsculas sobre los títulos: el rótulo de lugar es un dato, no decoración.
- Escribir datos de ejemplo en el código para «llenar» una pantalla: van en `supabase/seed.sql`.
