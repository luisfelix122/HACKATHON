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

### Candidatos de referencia para los 16 productos publicados pendientes

La búsqueda incluye ahora una fuente específica para **cada uno de los 16 productos**.
Son referencias para elegir imágenes: no están aprobadas para cargar ni se incorporan
como originales. No se ha confirmado una licencia de reutilización de estas fotografías
comerciales. La coincidencia se apoya en las descripciones de las fuentes; los materiales
no se dan por probados solo por el aspecto de la foto.

| Producto | Candidato de referencia | Coincidencia / diferencia por revisar |
| --- | --- | --- |
| 01: Top de bikini Atardecer | [Bikini naranja de crochet con flores](https://www.crochetkingdom.com/orange-crochet-bikini-with-flower-motifs/) | Naranja, crochet y algodón; motivos florales. No acredita algodón pima. Que el patrón sea gratuito no implica permiso para reutilizar su foto. |
| 02: Falda larga calada | [Crochet Beach Maxi Skirt blanca — AmiEmi](https://amiemi.com/es/products/crochet-beach-maxi-skirt) | Falda larga blanca de playa; confirmar técnica y composición de algodón. |
| 04: Bolso Red de Pescador | [Trenza Macrame Net Bag — Tin Marin](https://tinmarinbrand.com/products/trenza-macrame-net-bag) | Bolso de red de macramé y algodón; referencia fabricada en México. |
| 05: Porta botella cruzado | [Porta Botella — Ponte Cuerda](https://pontecuerda.cl/producto/porta-botella/) | Macramé de cuerdas de algodón natural, correa larga; referencia chilena. |
| 06: Tapiz Olas | [Macrame Wave Wall Hanging — OlivetCo](https://www.etsy.com/listing/695646606/macrame-wave-wall-hanging) | Patrón de ola, algodón y rama recogida en playa; revisar escala y encuadre. |
| 08: Cartera de mano de toquilla | [Cartera cilíndrica — Asociación Virgen del Pilar](https://pajatoquilla.ruraqmaki.pe/producto/cartera-colindro-color-marron-oscuro) | Toquilla tejida y asas de cuero, Catacaos; diseño cilíndrico marrón. |
| 09: Abanico Frescor | [Woven Straw Hand Fan — Sensi Studio](https://www.farfetch.com/ph/shopping/women/sensi-studio-woven-straw-hand-fan-item-30255167.aspx) | Abanico redondo de toquilla; incorpora cuero y marca en el mango. |
| 11: Llavero Pez Espada | [Wooden Fish Keychain — PongiWorks](https://www.etsy.com/listing/242207688/wooden-fish-keychain-walnut-wood-animal) | Candidato aproximado: pez de madera y aro metálico; es nogal y no se acredita pez espada. No asignar como coincidencia exacta. |
| 14: Collar Gota de Mar | [Collar Perla irregular — La Femme Unchained](https://www.lafemmeunchained.com/collections/collares/products/collar-perla-irregular) | Perla natural irregular y plata 925; lleva marco ennegrecido adicional. |
| 15: Pulsera Tres Perlas | [Triple Scoop Macramé — Klara Haloho](https://www.klarahaloho.com/products/triple-scoop-macrame-freshwater-pearl-bracelet) | Tres perlas de agua dulce en macramé; usa cuero, no hilo encerado. Candidato aproximado. |
| 16: Collar Oro Rojo | [Red & Swirls — colgante de Spondylus rojo](https://www.etsy.com/listing/1017166576/red-swirls-rare-red-spiny-oyster-red) | Colgante central rojo; montura de plata, no alpaca. Candidato aproximado. |
| 17: Aretes Sol Tallán | [Spondylus Circles Earrings — La Vida Ventura](https://christina-lauridsen.squarespace.com/silver-jewelry/spondylus-circles-earrings) | Aretes circulares de Spondylus; incrustación morada y plata 950, no 925. |
| 18: Pulsera de chispas moradas | [Pulsera Spondylus Morado — Viancca](https://viancca.com.pe/producto/pulsera-spondylus-morado/) | Coincide material y color; candidata aproximada de incrustación, no fragmentos ensartados en nylon. |
| 19: Billetera de perico | [Genuine Mahi Mahi Fish Leather Wallets — Spearman Artisanry](https://www.spearmanartisanry.com/products/genuine-mahi-mahi-fish-leather-wallets) | Cuero de mahi-mahi/perico y compartimentos para tarjetas y billetes; forro reciclado no acreditado. |
| 20: Llavero Quilla de Surf | [Hawaiian Koa Surf Fin Keychain — WoodandShell](https://www.etsy.com/listing/674772191/hawaiian-koa-surf-fin-keychain) | Candidato por forma: quilla de madera koa; no incorpora cuero de pescado ni madera balsa. Coincidencia parcial. |
| 21: Tarjetero Marino | [Billetera tarjetero de cuero de pescado — QAYA / HAF Perú](https://hafperu.org/en-pe/products/billetera-tarjetero-by-qaya) | Tarjetero artesanal peruano de cuero de pescado; combina cuero ovino y bovino. Especie de pescado sin confirmar. |

Alternativas con licencia de uso comprobada, pero diseño diferente:
[collar de una perla redonda CC0 — Sound Media](https://www.publicdomainpictures.net/en/view-image.php?image=366252&picture=silver-necklace-with-pearl-pendant),
[tapiz geométrico — rocknwool / Unsplash](https://unsplash.com/photos/yas-CnrBwTw),
[tapices en conjunto — Pexels](https://www.pexels.com/photo/macrame-wall-hanging-8503255/) y
[bolsos de trama cerrada — Pexels](https://www.pexels.com/it-it/foto/borse-in-macrame-fatte-a-mano-appese-in-un-mercato-33194363/).

Estas referencias no significan que el autor avale Ayllu ni que las piezas pertenezcan
a los vendedores ficticios. Para publicar una fotografía comercial hace falta permiso
aplicable a esa imagen. No se generaron imágenes con IA.

| Producto | Estado |
| --- | --- |
| 01: Top de bikini Atardecer tejido a crochet | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 02: Falda larga calada para la playa | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 04: Bolso de macramé Red de Pescador | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 05: Porta botella cruzado de macramé | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 06: Tapiz de macramé Olas | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 08: Cartera de mano de paja toquilla | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 09: Abanico de paja toquilla Frescor | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 11: Llavero tallado Pez Espada | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 14: Collar Gota de Mar con perla | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 15: Pulsera de macramé Tres Perlas | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 16: Collar Oro Rojo de Spondylus | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 17: Aretes Sol Tallán de Spondylus | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 18: Pulsera de chispas de Spondylus morado | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 19: Billetera de cuero de pescado perico | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 20: Llavero Quilla de Surf en cuero de pescado | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 21: Tarjetero Marino de cuero de pescado | Candidato enlazado arriba; permiso de foto y diferencias pendientes de resolver. |
| 22: Top edición especial (retirado) | Fuera de los 16 publicados pendientes; requiere foto correspondiente. |
| 23: Billetera en creación (borrador) | Fuera de los 16 publicados pendientes; requiere foto correspondiente. |

Para cerrar estos pendientes se necesitan fotos propias de las piezas o permiso del autor de una imagen realmente coincidente. Las fotos comerciales encontradas sin licencia de reutilización no se incluyen. No se generaron imágenes con IA.

## Carga y validación

1. Confirmar autorización y permisos de escritura sobre el servidor de demo. No resetear la BD compartida ni recrear vendedores/productos.
2. Cargar únicamente los JPEG 03, 07 y 13 después de añadir su atribución, tras comprobar que el objeto no existe. El 12 ya está cargado: verificar y omitir. No sobrescribir originales existentes. El 10 queda excluido hasta recibir aprobación específica de su coincidencia visual parcial.
3. Revisar créditos de las fichas existentes antes de publicar: la semilla no sobrescribe registros previos.
4. Comprobar vitrina a 360 y 1440 px y `/admin` con una cuenta real. Los usuarios de Auth de la semilla no sirven para iniciar sesión.
5. Los teléfonos ficticios se conservan por indicación de Johann para esta etapa. No usarlos para contactar a personas; el reemplazo por el número consentido del equipo queda para antes de la demo.

La semilla conserva 10 perfiles, 23 productos (21 publicados), 23 registros SQL de fotos, dos órdenes y dos mensajes al aplicarse dos veces. Los registros SQL pendientes no implican que sus archivos existan en Storage.

## Estado comprobado el 11 de octubre de 2026

- Consulta pública: 21 productos, 7 artesanos y 21 registros de fotos. El producto retirado no aparece.
- Foto 12: GET público HTTP 200, `image/jpeg`, 82 072 bytes; contenido idéntico al JPEG local.
- Las otras 20 rutas publicadas devolvieron HTTP 400 en GET público. Este resultado no sustituye el listado autenticado de Storage para decidir una carga.
- El agente del servidor informó que 03, 07, 10 y 13 estaban ausentes. No se realizó ninguna carga ni cambio de BD desde el equipo local en esta comprobación.
- `make verify`: 110 pruebas aprobadas; seis advertencias de lint preexistentes. `make build`: web y artesano correctos.
- Pendiente: acceso de carga desde el equipo local, atribuciones de 03/07/13, fotos utilizables para los 16 productos indicados, decisión específica sobre 10 y comprobación manual del usuario a 360 y 1440 px. PRP 007 incompleto.
