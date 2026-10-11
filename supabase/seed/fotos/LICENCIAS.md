# Fotos por producto — PRP 007

Selección revisada contra los 21 productos publicados existentes. Se retiraron las referencias por familia que mostraban otro objeto. Hay cinco archivos seleccionados y 18 destinos pendientes (16 publicados, uno retirado y uno borrador). Ningún archivo pendiente debe sustituirse por una imagen de otra pieza.

Estas cinco imágenes son referencias de demo del mismo tipo de objeto, no fotos originales de los artesanos ficticios. Las diferencias y los materiales no verificables se declaran a continuación. La embarcación a escala es una coincidencia visual parcial: no acredita una chalana de Cabo Blanco. No se cambian nombres, materiales ni productos de Supabase para acomodarlos a una foto.

Los créditos se guardan en `ficha.descripcion` al aplicar la semilla sobre una base limpia. `ON CONFLICT DO NOTHING` no actualiza fichas existentes: antes de publicar fotos en el servidor se deben revisar los créditos de los registros actuales.

## Selección, origen y licencia

| Producto | Foto y autor | Fuente / licencia | Correspondencia y límites |
| --- | --- | --- | --- |
| 03: Sombrero flexible de crochet | `10000000-0000-0000-0000-000000000003.jpg` — dani0010 | [Natural crocheted sun hat](https://www.flickr.com/photos/21609187@N00/3451315456) · [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | Sombrero de crochet con ala. Algodón pima/grueso no acreditado por la foto. |
| 07: Sombrero chalán de paja toquilla fina | `10000000-0000-0000-0000-000000000007.jpg` — Hex | [Panama hat.jpg](https://commons.wikimedia.org/wiki/File:Panama_hat.jpg) · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | Sombrero de paja toquilla; referencia ecuatoriana, no evidencia de origen piurano. |
| 10: Chalana de Cabo Blanco a escala | `10000000-0000-0000-0000-000000000010.jpg` — roger4336 | [São Paulo - Jangada Fishing Boat Model](https://www.flickr.com/photos/24736216@N07/10445430445) · [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | Modelo de embarcación pesquera con vela (jangada brasileña), no una chalana de Cabo Blanco. Coincidencia visual parcial; no acredita madera balsa. |
| 12: Balsa miniatura atada a mano | `10000000-0000-0000-0000-000000000012.jpg` — Autor desconocido | [Bolivia, Mosetenes raft, model in the Vatican Museums.jpg](https://commons.wikimedia.org/wiki/File:Bolivia,_Mosetenes_raft,_model_in_the_Vatican_Museums.jpg) · [Public domain](https://commons.wikimedia.org/wiki/File:Bolivia,_Mosetenes_raft,_model_in_the_Vatican_Museums.jpg) | Miniatura de balsa con piezas atadas. No acredita la especie de madera ni la procedencia. |
| 13: Aretes de perla cultivada en plata | `10000000-0000-0000-0000-000000000013.jpg` — NATALIA PHOTOS | [Beautiful Handmade Sterling Silver Pearl Earrings](https://www.flickr.com/photos/71099398@N00/2208368349) · [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) | Aretes artesanales de perla y plata. La pureza 950 y la procedencia de las perlas no están acreditadas por la imagen. |

Se verificaron los metadatos de Wikimedia y, para las tres fuentes de Flickr, el enlace Creative Commons en la página original. No se eliminan marcas de autor ni se alteran colores, formas o texturas. Solo se normaliza orientación y se reduce/comprime a JPEG. Las fotos CC BY-SA conservan esa licencia, independiente de la licencia del código.

## Archivos y rutas de carga

| Archivo local | Bytes | Ruta en el bucket público `fotos` |
| --- | ---: | --- |
| `10000000-0000-0000-0000-000000000003.jpg` | 62097 | `00000000-0000-0000-0000-000000000001/10000000-0000-0000-0000-000000000003/original.jpg` |
| `10000000-0000-0000-0000-000000000007.jpg` | 199105 | `00000000-0000-0000-0000-000000000003/10000000-0000-0000-0000-000000000007/original.jpg` |
| `10000000-0000-0000-0000-000000000010.jpg` | 103648 | `00000000-0000-0000-0000-000000000004/10000000-0000-0000-0000-000000000010/original.jpg` |
| `10000000-0000-0000-0000-000000000012.jpg` | 82072 | `00000000-0000-0000-0000-000000000004/10000000-0000-0000-0000-000000000012/original.jpg` |
| `10000000-0000-0000-0000-000000000013.jpg` | 37809 | `00000000-0000-0000-0000-000000000005/10000000-0000-0000-0000-000000000013/original.jpg` |

Todos los JPEG tienen como máximo 1000 px en su lado mayor y menos de 300 KB (300 000 bytes).

## Fotos pendientes

| Producto | Motivo |
| --- | --- |
| 01: Top de bikini Atardecer tejido a crochet | Los candidatos libres encontrados no coinciden con el top naranja descrito. |
| 02: Falda larga calada para la playa | Las faldas encontradas difieren de la falda larga calada en corte o técnica. |
| 04: Bolso de macramé Red de Pescador | No se encontró el bolso de red de macramé de algodón; la referencia anterior era otro bolso. |
| 05: Porta botella cruzado de macramé | Los portabotellas encontrados son de crochet o paracord, no el macramé descrito. |
| 06: Tapiz de macramé Olas | Los tapices libres encontrados son circulares, sin la rama ni el patrón de olas descritos. |
| 08: Cartera de mano de paja toquilla | Los bolsos encontrados son de ratán, no de paja toquilla con cuero. |
| 09: Abanico de paja toquilla Frescor | Los abanicos encontrados son de rafia u otras palmas; no hay coincidencia verificada con toquilla. |
| 11: Llavero tallado Pez Espada | Los llaveros de pez encontrados son metálicos, no el pez espada tallado. |
| 14: Collar Gota de Mar con perla | Los collares encontrados difieren del dije de una perla irregular en cadena de plata. |
| 15: Pulsera de macramé Tres Perlas | No se encontró la pulsera de macramé con tres perlas. |
| 16: Collar Oro Rojo de Spondylus | Los candidatos libres son arqueológicos o de otra forma/material; no el collar rojo contemporáneo descrito. |
| 17: Aretes Sol Tallán de Spondylus | No se encontraron los aretes circulares de Spondylus y plata. |
| 18: Pulsera de chispas de Spondylus morado | No se encontró pulsera de fragmentos morados de Spondylus. |
| 19: Billetera de cuero de pescado perico | Las billeteras encontradas son de cuero convencional o de pesca; no cuero de perico. |
| 20: Llavero Quilla de Surf en cuero de pescado | No se encontró un llavero de quilla forrado con cuero de pescado. |
| 21: Tarjetero Marino de cuero de pescado | Los tarjeteros encontrados son de cuero convencional; no cuero de pescado. |
| 22: Top edición especial (retirado) | Top retirado; requiere foto que corresponda, sin reutilizar un sombrero. |
| 23: Billetera en creación (borrador) | Borrador de billetera de pescado; requiere foto propia o libre coincidente. |

Para cerrar estos pendientes se necesitan fotos propias de las piezas o permiso del autor de una imagen realmente coincidente. Las fotos comerciales encontradas sin licencia de reutilización no se incluyen. No se generaron imágenes con IA.

## Carga y validación

1. Confirmar autorización y permisos de escritura sobre el servidor de demo. No resetear la BD compartida ni recrear vendedores/productos.
2. Cargar únicamente los cinco JPEG seleccionados en las rutas indicadas, tras comprobar que el objeto no existe. No sobrescribir originales existentes. Revisar la coincidencia visual parcial de la embarcación con el responsable antes de usarla en la demo.
3. Revisar créditos de las fichas existentes antes de publicar: la semilla no sobrescribe registros previos.
4. Comprobar vitrina a 360 y 1440 px y `/admin` con una cuenta real. Los usuarios de Auth de la semilla no sirven para iniciar sesión.
5. Los teléfonos ficticios se conservan por indicación de Johann para esta etapa. No usarlos para contactar a personas; el reemplazo por el número consentido del equipo queda para antes de la demo.

La semilla conserva 10 perfiles, 23 productos (21 publicados), 23 registros SQL de fotos, dos órdenes y dos mensajes al aplicarse dos veces. Los registros SQL pendientes no implican que sus archivos existan en Storage.
