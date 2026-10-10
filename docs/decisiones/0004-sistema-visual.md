# 0004 — Sistema visual: «Guía de encomienda» con paleta «Mar de Cabo Blanco»

- Fecha: 2026-10-10
- Estado: aceptada
- Decide: Cristopher (paleta) · Proceso: skills `impeccable` (sorteo de dirección, semilla `53771803`) y `frontend-design`

## Contexto
La marca parte de cero (PRODUCT.md). La página de decisión de `impeccable` presentó direcciones visuales, y el equipo eligió la paleta por contexto (playas del norte de Piura) en lugar de una dirección. La dirección asignada por el sorteo se mantuvo porque nadie la rechazó.

## Alternativas
| Opción | A favor | En contra |
| --- | --- | --- |
| **Guía de encomienda** (sorteo) | Cada pieza es una etiqueta atada, sellada con el RNA; el pedido se escribe en casillas. Encaja con «confianza visible» y con «acuerdos en datos» | Riesgo de quedarse en una textura beige si la etiqueta no funciona como objeto |
| Marquilla tejida | Familiar para artesanía | Deja fuera la bisutería marina y el tallado; es la más previsible |
| Afiche serigrafiado / manual por pasos | Fuertes en un solo canal (comprador o artesano) | Pierden claridad en el otro |
| Estándar de marketplace | Cero riesgo | Igual a cualquier tienda |

## Decisión
- **Mundo:** «Guía de encomienda»:
  - Cada producto se muestra como una **etiqueta** (forma de etiqueta con ojal) en arena seca.
  - La **acreditación** es un **sello** circular en azul Pacífico («RNA verificado»).
  - Los formularios del artesano son **casillas numeradas, una por pantalla**.
- **Paleta «Mar de Cabo Blanco»** (elegida por el equipo):
  - Fondo blanco espuma `#F5FAFA`.
  - Azul Pacífico `#0B4F6C` (principal y sello).
  - Turquesa ola `#1A9E97` (apoyo y estado correcto).
  - Arena seca `#E3C98F` (etiquetas y campos).
  - Sol del norte `#F2B705` (lo más importante, una vez por pantalla).
  - Azul noche `#0A2533` (texto).
- **Tipografía** (empaquetada en la app, sin CDN, para que la APK funcione sin señal):
  - **Atkinson Hyperlegible** (Braille Institute, OFL-1.1) para el texto y los controles. Está diseñada para máxima legibilidad, lo que conviene a usuarios con poca experiencia digital y a lectura al sol.
  - **Barlow Condensed** (OFL-1.1), en mayúsculas compactas, **solo** dentro del sello y en el número de casilla. Imita la rotulación de las guías y los sellos de goma.
- **Movimiento:** solo como respuesta a una acción (sellar, guardar), de 150–250 ms, y respetando `prefers-reduced-motion`.

## Motivo
Lo pidió el equipo (paleta) y lo asignó el sorteo de `impeccable` (mundo). El mar y el sol identifican la región ante el turista. El contraste alto del azul noche sobre blanco espuma sirve al sol. La etiqueta y el sello hacen visible la confianza (RNA) antes que el precio.

## Consecuencias
- **Positivas:** una identidad propia y local; componentes reutilizables (etiqueta, sello, casilla, aviso) para los PRP 002 a 007.
- **Negativas / costos:**
  - Dos dependencias de fuentes (`@fontsource/*`, OFL-1.1), con un peso extra en el bundle.
  - El arena seca no sirve para texto: solo para campos.
- **Qué cambia:**
  - Nuevo PRP 011.
  - `src/compartido/ui/`.
  - `DESIGN.md`, que se escribe al final, desde lo construido, según `impeccable`.
