# PRP 004 — Vitrina pública

- Caso de uso: CU-04 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (actualizado por CC-09)
- Rama: `cu-04/vitrina`

## Objetivo
Cualquier visitante, sin cuenta, desde el celular o la laptop, puede:
- Buscar productos publicados por nombre o título.
- Filtrarlos por lugar, tipo de producto, asociación y etiqueta (chips).
- Abrir la ficha de un producto: carrusel con las fotos publicadas, título, descripción, materiales, técnica, etiquetas, precio y disponibilidad.
- Ver el perfil del artesano: historia, lugar, asociación y sello «RNA verificado».
- Contactarlo por WhatsApp.

## Por qué
Es el criterio 3 del reto: una vitrina accesible para clientes externos, con el valor cultural del artesano. Es la primera escena de la demo, donde el visitante escanea el QR.

## Criterios de aceptación
- [ ] `/` lista solo los productos `publicado` de artesanos `aprobada`, sin iniciar sesión.
- [ ] La búsqueda por nombre o título no distingue mayúsculas ni tildes. Los filtros se combinan entre sí y se reflejan en la URL (`?lugar=Lobitos&tipo=textil&etiqueta=filigrana`), así que un enlace o un QR puede apuntar a un filtro.
- [ ] El catálogo muestra como chips las etiquetas más usadas entre los productos visibles; tocar una la agrega al filtro (CC-09).
- [ ] `/producto/:id` muestra un carrusel con las fotos `publicada` en su `posicion`, y el enlace «Ver foto original» cuando la original no está entre las publicadas, además de los datos de la ficha y sus etiquetas. Para un producto `a_pedido` muestra «Se hace a pedido en N días»; para uno `en_stock`, «Disponible ahora». **Nunca** muestra una cantidad en stock (CC-09).
- [ ] Las tarjetas del catálogo muestran la primera foto publicada y el `titulo` de la ficha.
- [ ] `/artesano/:id` muestra el perfil público y sus productos. El sello solo aparece si la acreditación está `aprobada`.
- [ ] El botón de WhatsApp abre `https://wa.me/<numero>?text=<mensaje prellenado con el nombre del producto>`, con el texto codificado.
- [ ] Un producto inexistente o no publicado muestra «Producto no disponible», sin errores en la consola.
- [ ] El diseño se ve bien en 360 px y en 1440 px.
- [ ] La vitrina se puede traducir con la función del navegador (Chrome o Safari): `lang="es"` declarado y ningún `translate="no"` salvo en la marca «Ayllu» (decisión 0005).
- [ ] Hay datos semilla ficticios (al menos 3 artesanos y 8 productos) para desarrollar, aunque los PRP 002 y 003 no estén listos.

## Contexto necesario
- **Dominio:** Visitante, Producto, Ficha, Lugar, Asociación, Tipo de producto, Disponibilidad; regla 2.
- **Contratos:** `docs/contratos.md` §Permisos (anónimo), §`producto`, §Ficha, §`foto_producto`, §`perfil`, §Archivos (bucket `fotos` público), §Convenciones (lugares, datos de prueba).
- **Decisiones:** `0001-stack.md`, `0003-autohospedaje-supabase-y-web.md` (web en `ayllu.likadev.com`), `CC-09.md`.
- **Código existente a imitar:** `src/acceso/perfil.ts` (consultas); `src/compartido/dominio/lugares.ts`.
- **Documentación externa:**
  - https://supabase.com/docs/reference/javascript/select: filtros `eq`, `ilike` y `or`.
  - https://faq.whatsapp.com/5913398998672934: verificado el 2026-10-10. El formato es `https://wa.me/<número>?text=<texto codificado en URL>`, con el número completo en formato internacional y sin `+`, ceros iniciales, paréntesis ni guiones.
- **Trampas conocidas:**
  - **Tildes:** `ilike` no las ignora. Usar una columna normalizada (`unaccent` en una vista) o normalizar en el cliente. Elegir la opción más simple que pase la prueba.
  - **Datos personales:** la vista pública no debe exponer `rna_numero` ni `acreditacion_nota`.
  - **Etiquetas en `jsonb`:** filtrar con `ficha->'etiquetas' ? 'filigrana'` (operador `?` de `jsonb`); exponerlas en la vista como `text[]` para el cliente.
  - **Carrusel en 360 px:** deslizar con el dedo y con botones visibles; texto alternativo con el título y la variante.
  - **Datos semilla:** sin datos del padrón; nombres y fotos ficticios o de objetos propios del equipo.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0004_vitrina.sql` | vistas `producto_publico` (producto unido a `artesano_publico`, con nombre y título normalizados y etiquetas) y `foto_publica` (fotos publicadas y la original de productos publicados); `grant select` a `anon` |
| modificar | `supabase/seed.sql` | ya existe con la muestra de la demo (CC-10); solo se ajusta si la vista o el esquema lo exigen |
| crear | `src/vitrina/consultas.ts` | catálogo, producto y perfil |
| crear | `src/vitrina/filtros.ts`, `src/vitrina/filtros.test.ts` | filtros ↔ URL (incluye `etiqueta`) y normalización |
| crear | `src/vitrina/whatsapp.ts`, `src/vitrina/whatsapp.test.ts` | construcción del enlace `wa.me` |
| crear | `src/vitrina/Catalogo.tsx` | búsqueda, filtros, chips de etiquetas y tarjetas |
| crear | `src/vitrina/CarruselFotos.tsx` | fotos publicadas, enlace a la original |
| crear | `src/vitrina/FichaProducto.tsx` | detalle con carrusel, etiquetas y botones WhatsApp y «Pedir» (el botón «Pedir» se conecta en el PRP 005) |
| crear | `src/vitrina/PerfilArtesano.tsx` | historia, sello y productos |
| modificar | `src/app/AppWeb.tsx` | rutas `/`, `/producto/:id`, `/artesano/:id` |
| modificar | `src/compartido/ui/estilos.css` | tarjetas y cuadrícula adaptable |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. La migración 0004 y los datos semilla. Aplicarlos.
2. `filtros.ts` y `whatsapp.ts`, con sus pruebas primero.
3. `consultas.ts` y las tres pantallas.
4. Revisar el diseño en 360 px y 1440 px. Publicar `dist-web` en el servidor (PRP 010).

## Validación
1. `make verify`.
2. **Pruebas a crear:**
   - `filtros`: URL → filtros → URL (ida y vuelta), con etiqueta; tildes; filtros vacíos.
   - `whatsapp`: número E.164 sin `+` en la URL; texto con espacios y tildes codificado.
3. **Prueba manual:**
   - En una ventana de incógnito, abrir `/?lugar=Lobitos` → abrir un producto → abrir el perfil → WhatsApp abre con el mensaje.

## Fuera de alcance
- Preferencias y orden por afinidad.
- Traducción de la vitrina.
- Paginación (si hay más de 50 productos, se agrega después).
- Mostrar cantidades en stock (CC-09).

## Notas / riesgos
- La lista de lugares es preliminar: ver `contratos.md`.
