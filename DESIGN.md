---
name: Ayllu
description: Guía costera para descubrir piezas, su origen y las manos que las crean.
colors:
  casco: "#1D3F5E"
  casco-hondo: "#142E45"
  casco-claro: "#E6EDF3"
  cal: "#FAF8F4"
  sol-web: "#E0B252"
  sol-claro-web: "#F6EDD9"
  emblema: "#C4973E"
  borda: "#A8432C"
  brea: "#1B1F24"
  linea: "#E4DFD6"
  texto-secundario-web: "#555A61"
  blanco: "#FFFFFF"
  error: "#B42318"
  error-claro: "#FDE8E6"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.8rem, 4.4vw, 4.2rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control-web: "8px"
  control-apk: "10px"
  panel: "14px"
spacing:
  e1: "4px"
  e2: "8px"
  e3: "12px"
  e4: "16px"
  e5: "24px"
  e6: "32px"
  e7: "48px"
  e8: "72px"
components:
  button-primary-web:
    backgroundColor: "{colors.casco}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.control-web}"
  button-primary-hover-web:
    backgroundColor: "{colors.casco-hondo}"
    textColor: "{colors.blanco}"
  button-featured-web:
    backgroundColor: "{colors.sol-web}"
    textColor: "{colors.casco-hondo}"
    rounded: "{rounded.control-web}"
  button-featured-hover-web:
    backgroundColor: "{colors.sol-claro-web}"
    textColor: "{colors.casco-hondo}"
---

# DESIGN — Ayllu

## Overview

**Guía costera de usuario.** La web combina el papel claro de una guía de viaje, azul marítimo, acentos de sol y títulos editoriales. Las piezas, su origen y quien las crea conducen al catálogo y al trato directo con el artesano.

La identidad web corresponde al PRP 013 y `docs/cambios/CC-16.md`, solicitado el 2026-10-11. Sustituye la presentación provisional de la web. El sistema del PRP 011 y `docs/decisiones/0004-sistema-visual.md` continúa como base funcional de la APK: guía de encomienda, casillas numeradas, etiquetas colgantes y sello RNA.

**Regla del ámbito.** `src/compartido/ui/tokens.css` conserva sus valores originales. `src/app/web.css` redefine los tokens semánticos dentro de `.web-ayllu` y aplica tipografía y superficies solo a la web; `src/vitrina/vitrina.css` contiene la composición editorial. La APK mantiene los tokens y fuentes originales. El emblema de `Logotipo`, compartido por ambos destinos, sí reemplaza el texto provisional.

Este documento describe el código implementado. Entidades, estados y flujos siguen definidos en `docs/contratos.md` y `docs/plan.md`. Los módulos añaden CSS en su carpeta y reutilizan los componentes de `src/compartido/ui/componentes.tsx`; no editan el núcleo fuera de su PRP.

## Colors

Los valores web están en el frontmatter. Casco cubre acciones principales y bandas editoriales; casco profundo sirve al texto y al hover. Cal es el fondo general y el texto sobre azul. Sol web marca acciones y la franja de caletas; sol claro suaviza su hover. El oro del emblema es independiente del oro de los botones. Borda distingue el lugar de origen; gris secundario sirve a autoría y ayudas; línea separa contenido.

En `.web-ayllu`, `--pacifico` y `--pacifico-hondo` apuntan a casco y casco profundo; `--espuma` a cal; `--noche` a casco profundo; `--ola-clara` a casco claro. Arena usa sol claro y arena clara usa cal. Blanco, error y el turquesa de `--ola` se heredan de la base.

**Paleta conservada para la APK:**

| Token base | Valor | Uso |
| --- | --- | --- |
| `--espuma` / `--blanco` | `#F5FAFA` / `#FFFFFF` | Página y superficies |
| `--pacifico` / `--pacifico-hondo` | `#0B4F6C` / `#083A50` | Barra, acciones, enlaces y hover |
| `--ola` / `--ola-clara` | `#1A9E97` / `#DFF2F0` | Información, éxito y foco de campos |
| `--arena` / `--arena-clara` | `#E3C98F` / `#F3E8CF` | Etiqueta y campos |
| `--sol` / `--sol-claro` | `#F2B705` / `#FDF1C9` | Acción destacada y alertas |
| `--noche` / `--noche-suave` | `#0A2533` / `#3C5866` | Texto principal y secundario |
| `--error` / `--error-claro` | `#B42318` / `#FDE8E6` | Error y su superficie |

**Regla del texto legible.** Arena y sol son superficies, no texto sobre claro. Las pruebas de contraste existentes leen los tokens base; no cubren automáticamente las redefiniciones web. El traspaso del PRP registra cálculos adicionales: azul/cal 10,29:1; profundo/dorado 7,08:1; secundario/cal 6,55:1; borda/cal 5,65:1. No equivalen a una auditoría completa de todos los estados.

## Typography

Atkinson Hyperlegible (400 y 700) sirve al cuerpo, controles, precios y lectura continua, con base de 18 px. Fraunces (600 y 700), empaquetada con `@fontsource/fraunces`, se importa únicamente en `AppWeb.tsx`: títulos web a 600 y marca a 700. Las fuentes se sirven desde el build, sin CDN. Barlow Condensed (600 y 700) queda reservado al sello RNA y al número de casilla.

La web usa h1 de `clamp(2.2rem, 4vw, 3.8rem)`, h2 de `clamp(1.8rem, 3.2vw, 2.75rem)` y h3 de 1,35 rem. La portada usa la escala display del frontmatter y cambia en móvil a `clamp(2.25rem, 8vw, 2.75rem)`. El logotipo mide 44 px en escritorio y 30 px en móvil. La ficha usa h1 de `clamp(2rem, 3.5vw, 3rem)`.

La APK conserva 16 px pequeño, 18 px cuerpo, 21,6 px h3, 26 px h2 y 33,6 px h1. Los títulos base tienen interlineado 1,12 y espaciado de letras de -0,02 em. Los párrafos comparten máximo de 68 caracteres de ancho.

## Layout

La web centra el contenido en 1280 px como máximo. La cabecera admite hasta 1440 px, margen lateral de 40 px y un alto cercano a 96 px: el contenido tiene mínimo de 94 px más el borde. Bajo 768 px usa mínimo de 72 px, margen de 20 px y menú desplegable. El botón expone `aria-expanded` y `aria-controls`; las opciones cierran el menú al navegar. Bajo 401 px, Mi cuenta conserva icono y nombre accesible y oculta el texto visible.

El inicio `/` abre con texto y acción sobre azul a la izquierda, paisaje ilustrativo a la derecha y una imagen de oficio en marco claro inclinado. En móvil se ordenan texto, paisaje, oficio y franja de caletas. Siguen una selección de hasta cuatro piezas, beneficios, enlaces por lugar, hasta tres artesanos derivados del catálogo y tres pasos para pedir. La búsqueda del inicio se abre mediante `details`.

`/catalogo` contiene encabezado editorial, tipos de producto, búsqueda y filtros completos. La cuadrícula usa cuatro columnas desde 1100 px, dos entre 401 y 1099 px y una hasta 400 px, incluida la vista de 360 px. La ficha pasa de foto y datos en dos columnas desde 768 px a una en móvil. Caletas, artesanos y pasos de compra también se apilan bajo 768 px.

La APK conserva columna de trabajo de hasta 40 rem, margen de 16 px en celular y 32 px desde 768 px; las tareas secuenciales usan casillas numeradas.

## Elevation & Depth

Papel cal, bandas azules y separadores finos crean profundidad web. La cabecera clara termina en borde azul doble de 3 px y línea dorada. La imagen de oficio tiene marco claro, rotación de 4° y sombra `0 8px 24px rgb(20 46 69 / 25%)`. El degradado de portada conecta texto y paisaje y se retira en móvil.

Las piezas del catálogo web son imagen y ficha editorial abierta, sin sombra, ojal ni recorte de etiqueta. La APK conserva la etiqueta colgante con esquinas superiores cortadas, ojal y `--sombra-etiqueta`. El sello mantiene anillos e inclinación de -8°.

## Shapes

Los controles web usan radio de 8 px y borde de 1 px; la base APK conserva radio de 10 px y borde de 2 px. Los paneles de tarea tienen radio de 14 px. Botones y controles principales conservan mínimo táctil de 48 px; la acción de portada mide al menos 56 px. Los enlaces destacados de caletas en escritorio son una excepción implementada de 32 px y aumentan a 48 px en móvil.

El emblema entrelaza sol, chalana y A. `public/ayllu-icono.svg` acompaña la palabra Ayllu; `public/ayllu-favicon.svg` usa el mismo emblema dorado sobre fondo transparente, con trazos ajustados a la pestaña. Ambos incorporan trazos interiores cal. No añadir fondo azul al favicon.

## Components

| Componente o superficie | Aplicación real |
| --- | --- |
| `Logotipo` | Emblema decorativo con `alt=""` y palabra Ayllu; el enlace de cabecera y pie se anuncia como «Ayllu, inicio». |
| `Boton` | Primario azul, secundario blanco con contorno azul, destacado sol. Tipo button por defecto; carga deshabilita y usa `aria-busy`; deshabilitado tiene borde punteado. |
| `Campo` | Etiqueta asociada por id; ayuda o error mediante `aria-describedby`; error marca `aria-invalid`. En web, fondo blanco y borde gris. La validación se conserva. |
| `Aviso` | Información, carga, vacío, éxito, alerta y sin señal usan status; error usa alert. En web añade borde fino y espacio interior de 24 px. |
| `Casilla` | Grupo anunciado como «Paso N: título», h2 y número decorativo; conserva su función secuencial. |
| `Etiqueta` | Comparte título, lugar, autoría y precio. En catálogo web: título arriba, lugar y precio en la siguiente fila, autor y disponibilidad debajo; el precio se apila en móvil pequeño. La forma colgante sigue en la base. |
| `SelloRna` | Aprobada: «RNA verificado», doble anillo azul; pendiente: «RNA en revisión», gris y punteado. Representa el estado real. |
| Pieza de catálogo | Foto publicada de Supabase, carga diferida y «Foto no disponible» al faltar o fallar. Precio final en PEN y disponibilidad «Disponible» o «A pedido · N días» desde los datos. Enlace a la ficha. |
| Filtros | Búsqueda, lugar, tipo, asociación y etiquetas derivadas; selección con `aria-pressed`, filtros en URL y Limpiar filtros. El catálogo anuncia el número de resultados. |
| Caletas y artesanos | Caletas enlazan al catálogo filtrado. Artesanos deduplicados por id desde el catálogo enlazan al perfil; no son testimonios inventados. |
| Cómo pedir | Encontrar la pieza; ingresar y solicitar recojo o envío; confirmar y pagar con enlace del artesano. Entrega coordinada en el hilo de la orden; sin pasarela integrada. |

**Regla de la pieza real.** `costa.png` y `oficio.png` son ilustraciones editoriales creadas con IA. Sus textos alternativos y el crédito del inicio las identifican como ilustrativas; no representan productos, artesanos ni una caleta real del catálogo. Su procedencia está en `public/editorial/PROVENANCE.md`. No se usan para llenar fichas de producto.

El foco visible hereda contorno de 3 px con separación: azul sobre claro y cal sobre las bandas azules de portada y Cómo pedir. «Conocer las caletas» conserva cal al pasar el cursor. Existe enlace Saltar al contenido. Campos y avisos mantienen etiquetas, asociación de errores y anuncios accesibles.

El movimiento se limita a respuesta de controles (180 ms), aparición del sello (240 ms) y giro de carga; `prefers-reduced-motion` reduce animaciones y transiciones desde la base. La inclinación editorial es estática.

Evidencia en `docs/traspasos/CU-11-diseno-costero.md`: lint, formato, tipos y 154 pruebas existentes aprobados; builds web y artesano aprobados. GNU Make no estaba instalado y se ejecutaron sus cuatro comandos npm equivalentes. Persisten seis advertencias de lint existentes y advertencias de Vite por tamaño de chunks. Revisión IA: aprobar / ship, tras corregir hover y foco. Revisión humana pendiente.

La inspección registrada cubrió escritorio de 1419 px y móvil de 360 px sin desborde, imágenes, menú, búsqueda sin coincidencias, limpieza que recupera 16 productos, Cabo Blanco con 6 y enlaces de ficha y perfil. Son resultados de esa sesión, no cantidades fijas del producto. Zoom al 200 %, sesión autenticada, pedido completo y Android físico no se probaron. Los PNG editoriales suman aproximadamente 5,9 MB; la optimización de entrega queda para una tarea posterior antes de una eventual publicación.

## Do's and Don'ts

- Mantener identidad web dentro de `.web-ayllu` y conservar la base funcional de la APK.
- Usar Fraunces en títulos web y Atkinson en lectura, campos y precios; reservar Barlow al sello y número de paso.
- Dar protagonismo a piezas, lugar y artesano; organizar con bandas y separadores.
- Reservar sol a la acción principal de cada sección; portada y Cómo pedir son secciones distintas.
- Mostrar carga, error, vacío y disponibilidad con palabras claras y controles útiles.
- Conservar foco visible sobre cal y azul y respetar movimiento reducido.
- No añadir personas, precios, disponibilidad, testimonios ni métricas ficticios en el código; los datos de prueba van en `supabase/seed.sql`.
- No usar oro o arena como texto sobre claro, Barlow en párrafos ni ilustraciones editoriales como fotos de productos.
- No afirmar pago automático, sincronización de WhatsApp, integración de agencias o acreditación que contratos y datos no garanticen.
- No dar por comprobados zoom, sesión autenticada o Android físico a partir de compilaciones y pruebas existentes.
