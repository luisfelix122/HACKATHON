# PRP 013 — Rediseño completo: mundo «Rotulado de chalana»

- Caso de uso: CU-13 (nuevo, CC-17; transversal a CU-01 a CU-06)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: en curso (CC-17 y decisión 0006 aprobados el 2026-10-11)
- Rama: `rediseno/identidad-ayllu` (worktree propio). La fase 3 puede ir en un PR aparte.

## Objetivo
Toda la plataforma habla el mismo lenguaje visual (decisión 0006): la landing, el catálogo, el detalle, el perfil del artesano, el ingreso, los pedidos, la administración y la APK. Al terminar:
- **Comprador:** en `/` entiende en segundos qué es Ayllu, qué se hace en cada caleta y quién lo hace, y llega al catálogo (`/catalogo`) con un toque.
- **Artesano:** navega la APK con una barra de pestañas con icono y etiqueta, un paso por pantalla y botones grandes.
- **Administrador:** revisa las solicitudes con claridad y resuelve cada una en un modal accesible.

## Por qué
`docs/proyecto.md`: confianza visible (quién, dónde, RNA), un camino corto de la pieza al pedido y uso al sol con poca experiencia digital. La auditoría encontró que la portada es el catálogo, que la barra de la APK se parte y que no hay iconos, modales ni una navegación coherente.

## Criterios de aceptación
- [ ] **Landing en `/`:**
  - **Primera pantalla:** propuesta de valor y el acceso «Ver el catálogo» (destacado).
  - **Contenido real de la base:** las 9 caletas, que llevan al catálogo filtrado por lugar; los tipos de producto, que llevan al catálogo filtrado por tipo; piezas publicadas y artesanos aprobados.
  - **Nada inventado:** ni testimonios, ni cifras, ni artesanos, ni datos de producto. Sin foto en Storage, el tablón muestra el nombre rotulado, nunca una imagen de relleno.
- [ ] **Catálogo en `/catalogo`:**
  - Conserva búsqueda, filtros y estados de carga, vacío y error.
  - Un enlace antiguo `/?lugar=…&tipo=…` redirige a `/catalogo` con los mismos filtros.
  - `/producto/:id` y `/artesano/:id` no cambian.
- [ ] **Identidad consistente:** las pantallas de landing, catálogo, detalle, perfil, ingreso web, pedidos, administración y APK usan solo los tokens y componentes de `src/compartido/ui/`. Ningún módulo define colores, tipografías ni sombras propias.
- [ ] **Iconos:**
  - Un solo juego (`Icono`), de trazo uniforme.
  - Cada icono va con una etiqueta visible; si va solo, lleva `aria-label`.
  - No se agrega ninguna librería de iconos.
- [ ] **Modales** (sobre `<dialog>` nativo), en: aprobar o rechazar una acreditación, aceptar una orden, enviar el enlace de pago, marcar como enviada, rechazar o cancelar una orden, y «¿Olvidaste tu contraseña?». Comportamiento:
  - Se abren y cierran con teclado; `Esc` cierra.
  - El foco entra al primer campo y vuelve al botón que lo abrió.
  - El fondo queda inerte.
  - Si se cierra sin enviar, el formulario conserva lo escrito al reabrirlo.
  - Las acciones destructivas piden confirmación.
- [ ] **Formularios largos y procesos por pasos en pantalla completa:** registro del artesano, borrador, revisión y publicación, pedido del comprador.
- [ ] **APK:**
  - Barra de pestañas abajo con icono y etiqueta (Mis productos, Nuevo, Mis pedidos y Tu cuenta).
  - Objetivos táctiles de 48 px y texto base de 18 px.
  - Sin desborde horizontal a 360 px.
  - Abre sin conexión con sus fuentes.
- [ ] **Contraste AA** en todo texto, comprobado por la prueba de tokens con la paleta nueva. Además, foco visible y `prefers-reduced-motion` respetado.
- [ ] **No cambia el comportamiento:** contratos, permisos, validaciones, persistencia, sincronización y llamadas a la API. Las pruebas existentes siguen pasando, o cambian solo en textos o roles de presentación, justificados en el PR.
- [ ] **Verificación:**
  - `make verify`, `npm run build:web`, `npm run build:artesano` y `make apk` en verde.
  - Detector de impeccable sin hallazgos materiales.
  - Revisión del subagente `reviewer`.
- [ ] **Capturas antes y después** a 390 y 1280 px de cada pantalla, adjuntas al traspaso (no se commitean).
- [ ] **`DESIGN.md` reescrito** desde lo construido. La decisión 0004 queda marcada como reemplazada por la 0006.

## Contexto necesario
- **Dominio:** artesano, comprador, producto, ficha, borrador, orden, acreditación, RNA, lugar, asociación.
- **Contratos:** `docs/contratos.md` §Estados de interfaz (cargando, vacío, error, sin conexión, acción en curso). No se cambia ningún contrato.
- **Decisiones:** `0006-rotulado-de-chalana.md` (nueva) y `0004-sistema-visual.md` (reemplazada). CC-11 (módulos) y CC-17 (este cambio).
- **Código existente a imitar:**
  - `src/compartido/ui/componentes.tsx`: componentes con estados y ARIA, y sus pruebas.
  - `componentes.test.tsx`: la prueba de contraste que lee `tokens.css`.
- **Documentación externa:**
  - https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog: `showModal()`, `Esc`, fondo inerte y `returnFocus`.
  - https://fontsource.org/fonts/bungee
- **Trampas conocidas:**
  - **Módulos en desarrollo:** `cu-02` (borradores) y `cu-03` (publicación) tienen trabajo sin integrar. No editar sus archivos hasta que estén en `main` (CC-17, fase 3).
  - **Archivos que toca `cu-02`:** `src/acceso/rutas.tsx` y `src/app/app.test.tsx`. No editarlos sin actualizar antes con `main`.
  - **La base local no tiene todas las migraciones:** solo `0001–0003` y `0101`. No se aplican migraciones (instrucción del responsable); la verificación con datos necesita otra fuente.
  - **Bungee solo tiene mayúsculas:** se usa solo para nombres propios y títulos cortos, nunca para etiquetas ni párrafos.
  - **Aplicación de la semilla:** las fotos de la semilla (PR #14, CC BY-SA) exigen crédito. Si la landing las muestra desde Storage, muestra el autor y la licencia que traiga la ficha.
  - **`<dialog>`:** el `form method="dialog"` cierra al enviar. Los formularios de los modales usan su propio `onSubmit` y solo cierran cuando la acción termina bien.

## Archivos (alcance cerrado)
**Fase 1 — núcleo (sin conflicto con los módulos)**
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `docs/decisiones/0006-rotulado-de-chalana.md`, `docs/cambios/CC-17.md`, `docs/prp/013--rediseno-rotulado-de-chalana.md` | decisión, cambio de alcance y PRP |
| modificar | `docs/decisiones/0004-sistema-visual.md` | estado: reemplazada por 0006 |
| modificar | `docs/plan.md` | fila del CU-13 |
| modificar | `src/compartido/ui/tokens.css`, `src/compartido/ui/estilos.css` | paleta, tipografía, franjas, tablón, matrícula, modal y pestañas |
| modificar | `src/compartido/ui/componentes.tsx`, `src/compartido/ui/componentes.test.tsx` | componentes rediseñados y nuevos (`Franja`, `Tablon`, `Matricula`), y contraste de la paleta nueva |
| crear | `src/compartido/ui/Icono.tsx`, `src/compartido/ui/Modal.tsx`, `src/compartido/ui/Modal.test.tsx` | juego de iconos y modal accesible, con sus pruebas |
| modificar | `src/compartido/PantallaIngresoWeb.tsx` | ingreso web |
| modificar | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx` | barra web con iconos; barra de pestañas de la APK (conserva `nav` «Menú» y sus enlaces) |
| modificar | `src/main.tsx`, `package.json`, `package-lock.json` | entra `@fontsource/bungee`, sale `@fontsource/barlow-condensed` |
| modificar | `DESIGN.md` | se reescribe al terminar, desde lo construido |
| crear | `docs/traspasos/CU-13-cristopher.md` | auditoría, decisiones, verificación y pendientes |

**Fase 2 — módulos ya integrados (confirmar que no tienen trabajo abierto antes de empezar)**
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `src/vitrina/Portada.tsx`, `src/vitrina/Portada.test.tsx` | landing, con datos reales, y su prueba (caletas, tipos, redirección de filtros) |
| modificar | `src/vitrina/rutas.tsx` | `/` → landing; `/catalogo` → catálogo |
| modificar | `src/vitrina/Catalogo.tsx`, `FichaProducto.tsx`, `PerfilArtesano.tsx`, `CarruselFotos.tsx`, `vitrina.css` | presentación |
| modificar | `src/admin/PanelAcreditacion.tsx`, `src/admin/admin.css` | lista y modal para aprobar o rechazar |
| modificar | `src/acceso/IngresoArtesano.tsx`, `RegistroArtesano.tsx`, `EstadoAcreditacion.tsx`, `acceso.css` | presentación; modal de «¿Olvidaste tu contraseña?» |
| modificar | `src/pedidos/AccionesArtesano.tsx`, `AccionesComprador.tsx`, `DetalleOrden.tsx`, `MisPedidos.tsx`, `FormularioPedido.tsx`, `HiloMensajes.tsx`, `BotonPedir.tsx`, `pedidos.css` | presentación; modales para las acciones cortas del artesano |

**Fase 3 — cuando `cu-02` y `cu-03` estén en `main`**
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| modificar | `src/borradores/*.tsx`, `src/borradores/borradores.css` | presentación de borradores, un paso por pantalla |
| modificar | `src/publicacion/*.tsx`, `src/publicacion/publicacion.css` | presentación de revisión y publicación |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. **Pruebas primero (TDD):**
   - **Contraste:** la prueba de la paleta nueva en `componentes.test.tsx`.
   - **`Modal`:** foco inicial, `Esc`, retorno del foco y conservación de lo escrito.
   - **`Icono`:** nombre accesible.
2. **Tokens, componentes, iconos y modal**, hasta que pasen las pruebas.
3. **Fuentes en `main.tsx` y `package.json`.**
4. **Cáscaras de `src/app/`:** barra web y pestañas de la APK.
5. **Fase 2:** primero la prueba de la landing, que falla; después la landing, el catálogo en `/catalogo`, el detalle, el perfil, el admin, el acceso y los pedidos.
6. **Primera verificación:** `make verify`, los builds y `make apk`. Recorridos con el navegador a 390 y 1280 px. Detector de impeccable.
7. **Cierre:**
   - Revisión del subagente `reviewer` y del revisor final de impeccable.
   - Corregir y volver a verificar.
   - `DESIGN.md` y el traspaso.
8. **Fase 3:** cuando se integren `cu-02` y `cu-03`.

## Validación
1. `make verify`, `npm run build:web`, `npm run build:artesano` y `make apk`.
2. **Pruebas a crear:**
   - **`Modal`:** foco, `Esc`, retorno del foco y datos que se conservan.
   - **Contraste:** paleta nueva.
   - **Landing:** caletas y tipos llevan al catálogo filtrado; `/?lugar=X` redirige a `/catalogo?lugar=X`; sin piezas muestra el estado vacío, no relleno.
   - **Pruebas existentes:** siguen en verde.
3. **Recorridos con el navegador**, a 390 y 1280 px:
   - **Comprador:** landing → catálogo → filtro → ficha → pedir → mis pedidos.
   - **Administrador:** panel → aprobar o rechazar en el modal.
   - **APK:** ingreso → pestañas → nuevo.
   - **Teclado:** foco y `Esc` en cada modal.
4. **Prueba manual en Android (Cristopher):**
   - APK en modo avión: abre con sus fuentes y la barra de pestañas.
   - Objetivos táctiles al sol.
   - Modal de «¿Olvidaste tu contraseña?» con el teclado del celular.
5. **Cierre:** pasar el PRP, `docs/contratos.md`, el diff y los resultados al subagente `reviewer`, y registrar el traspaso en `docs/traspasos/CU-13-cristopher.md`.

## Fuera de alcance
- Cambios de lógica, contratos, permisos, esquema, migraciones, datos semilla o despliegue.
- Logo definitivo: el logotipo sigue siendo tipográfico, ahora rotulado.
- Fotos nuevas de producto, playas o artesanos. Solo se muestran las que existan en Storage con su crédito.
- Traducción de la interfaz (CU-08).

## Notas / riesgos
- **Datos para verificar:** la base local no tiene las vistas de la vitrina (`0201`). Para ver el catálogo con datos hace falta decidir una fuente, que se pregunta al responsable.
- **Rotulado:** si cae en folclor, se reduce, sin quitar el nombre rotulado de cada pieza y de cada artesano.
