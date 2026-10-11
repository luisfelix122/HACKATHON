# Traspaso CU-13: rediseño «Rotulado de chalana» (PRP 013, fases 1 y 2)

- **Responsable:** Cristopher
- **Rama:** `rediseno/identidad-ayllu`, en el worktree `C:\dev\HACKATHON-worktrees\rediseno`, desde `main` en `1a891e2`.
- **PRP:** `docs/prp/013--rediseno-rotulado-de-chalana.md`
- **CC:** `docs/cambios/CC-17.md`
- **Decisión:** `docs/decisiones/0006-rotulado-de-chalana.md` (reemplaza a la 0004)
- **Fecha:** 2026-10-11
- **Estado:** fases 1 y 2 implementadas y verificadas, sin commit. La fase 3 espera a `cu-02` y `cu-03`.

## Auditoría (antes)
Capturas a 390 y 1280 px del «antes», contra el servidor; no se commitean:
| Pantalla | Problema |
| --- | --- |
| Portada web | Era el catálogo: titular, una banda de caletas en texto y los filtros. No tenía propuesta de valor ni accesos destacados. |
| Catálogo | Con 21 piezas y casi ninguna foto, la cuadrícula era una pared de cajas «Foto no disponible». |
| Navegación web | Solo había «Ingresar». No había enlace al catálogo ni a «Mis pedidos», ni iconos. |
| Barra de la APK | Tres enlaces junto al logotipo, partidos en dos líneas a 390 px. |
| Componentes | Sin juego de iconos (salvo `Aviso`), sin modal y sin un lenguaje común. |
| Formularios cortos | Aceptar una orden, el enlace de pago, el número de guía y rechazar una acreditación iban en línea y alargaban las pantallas. |

## Proceso de dirección (impeccable)
1. Cristopher eligió **reemplazar** el mundo de la decisión 0004.
2. Se derivaron siete candidatos del mundo de la costa norte. El sorteo (semilla `9bfb688c`) asignó «Calcomanía de tabla»; hubo seis retadores del catálogo y el estándar de la categoría.
3. En la página de decisión, Cristopher eligió **«Rotulado de chalana»**, la propuesta propia del modelo.
4. La construcción fue guiada por código: no hay generación de imágenes en esta sesión.

## Archivos
**Fase 1, núcleo**
- `src/compartido/ui/tokens.css`: paleta «Casco pintado» y alias de compatibilidad para la fase 3.
- `src/compartido/ui/estilos.css`.
- `src/compartido/ui/componentes.tsx`: entran `Tablon`, `Matricula`, `Franja`, `Boton` con `icono` y `peligro`, y el logotipo rotulado; sale `Etiqueta`.
- `src/compartido/ui/Icono.tsx` y `Modal.tsx`: nuevos, con sus pruebas (`componentes.test.tsx`, `Modal.test.tsx`).
- `src/compartido/PantallaIngresoWeb.tsx`.
- `src/app/AppWeb.tsx`: barra con iconos (Catálogo, Mis pedidos, Administración solo para el admin, Ingresar/Salir).
- `src/app/AppArtesano.tsx`: barra de pestañas abajo; conserva el `nav` «Menú».
- `src/main.tsx`, `package.json` y `package-lock.json`: entra `@fontsource/bungee` (OFL-1.1) y sale `@fontsource/barlow-condensed`.
- Documentos: PRP 013, CC-17, decisión 0006, la 0004 marcada como reemplazada, CU-13 en `docs/plan.md` y este traspaso.

**Fase 2, módulos integrados**
- **Vitrina:** `src/vitrina/Portada.tsx` y su prueba (nuevos); `rutas.tsx` (`/` es la landing y `/catalogo` el catálogo); `Catalogo.tsx`, `FichaProducto.tsx`, `PerfilArtesano.tsx`, `CarruselFotos.tsx` y `vitrina.css`.
- **Administración:** `src/admin/PanelAcreditacion.tsx` y `admin.css`.
- **Acceso:** `src/acceso/IngresoArtesano.tsx`, `RegistroArtesano.tsx` y `acceso.css`. `EstadoAcreditacion.tsx` no necesitó cambios: su `Aviso` adopta el estilo nuevo.
- **Pedidos:** `src/pedidos/AccionesArtesano.tsx`, `AccionesComprador.tsx`, `DetalleOrden.tsx`, `MisPedidos.tsx`, `FormularioPedido.tsx`, `HiloMensajes.tsx`, `BotonPedir.tsx` y `pedidos.css`.

**No se tocaron**, porque tienen trabajo sin integrar de otras sesiones:
- `src/borradores/*` y `src/publicacion/*` (fase 3).
- `src/acceso/rutas.tsx` y `src/app/app.test.tsx`.

## Decisiones
- **Alias de tokens:** `tokens.css` mantiene los nombres anteriores (`--pacifico`, `--arena`, `--noche`, …) y los de `borradores.css` que nunca existieron (`--tierra`, `--fondo`, `--texto`, …), apuntando a la paleta nueva. Así, borradores y publicación adoptan los colores sin editar sus archivos. Se retiran en la fase 3.
- **Sin datos inventados:**
  - La landing usa la misma consulta del catálogo (`consultarCatalogo`): piezas, conteos por caleta y tipo, y artesanos aprobados.
  - Sin foto, el tablón pinta su color por tipo con «Sin foto todavía»; nunca una imagen de relleno.
  - La sección se llama «Piezas de la vitrina» y no «recién publicadas», porque el catálogo se ordena por título y no por fecha.
- **Sello RNA en la landing:** es verdad para todos, porque `producto_publico` solo une artesanos de `artesano_publico` (aprobados).
- **Modales:** son `<dialog>` nativos.
  - El contenido nunca se desmonta, así que lo escrito se conserva al cerrar sin enviar.
  - En pedidos, `DetalleOrden` remonta las acciones cuando cambia el estado de la orden: el modal se cierra solo cuando la acción sale bien, sin tocar `useAccionOrden`.
  - Rechazar o cancelar una orden y verificar el abono piden confirmación.
- **Bungee:** solo en nombres propios y títulos de sección (logotipo, landing, caletas, artesanos). Las pantallas de trabajo de la APK y del admin titulan con Atkinson, por legibilidad.
- **Catálogo en `/catalogo`:** `/?lugar=…` redirige con los mismos filtros; los enlaces de etiquetas y «Explorar piezas» apuntan a `/catalogo`.
- **Correcciones del detector de impeccable** (4 hallazgos):
  - Los avisos tenían un borde lateral grueso: ahora llevan el icono en una placa pintada.
  - Las tarjetas redondeadas tenían una franja superior gruesa: ahora la franja va pintada por dentro (`box-shadow: inset`), siguiendo las esquinas.

## Verificación
| Comprobación | Resultado |
| --- | --- |
| `make verify` | exit 0. 210 pruebas pasan. 6 avisos de lint preexistentes en `rutas.tsx` que no se tocaron |
| `npm run build:web` y `npm run build:artesano` | exit 0 |
| `make apk` | BUILD SUCCESSFUL. Bungee y Atkinson van en `assets/public/assets`, sin CDN |
| TDD | Las pruebas de `Modal`, `Icono`, `Matricula`, `Tablon`, el contraste de la paleta nueva y la landing (`Portada.test.tsx`) se escribieron primero y fallaron antes del código |
| Recorridos con navegador | 19/19, con Brave y `playwright-core` contra el servidor, en solo lectura. En lugar de `webapp-testing`, que necesita Python. Detalle abajo |
| Detector de impeccable | 0 hallazgos en la segunda pasada |
| Revisión | Subagente `reviewer` y revisión final de impeccable: ver la sección «Revisión» |

Los recorridos comprobaron:
- landing → catálogo → filtro por caleta → ficha → volver;
- Tab con foco visible;
- modal de la APK: se abre con Enter, el foco entra, el fondo queda inerte y `Esc` lo cierra devolviendo el foco;
- pestañas: navegan y quedan activas, con 68 px de alto;
- sin desborde a 360 px en 7 pantallas;
- sin objetivos táctiles menores de 48 px;
- sin errores de JavaScript.

Las capturas del antes y el después (23 pantallas) están en el scratchpad de la sesión y no se commitean.

## Hallazgo preexistente (no corregido)
Desde las costuras del PRP 012, cada salida importa los `rutas.tsx` de los seis módulos. Por eso la APK incluye pantallas web (vitrina, admin) y la web incluye las de la APK. Se comprobó igual en `main`. Corregirlo cambia la arquitectura de rutas; no es presentación. Lo decide el responsable del núcleo.

También preexistente: `acceso` y `borradores` declaran los dos `/` en la APK.

## Pruebas manuales pendientes (Cristopher)
- [ ] **APK instalada en Android, en modo avión:** abre con Bungee y Atkinson, la barra de pestañas abajo y sin desborde.
- [ ] **Al sol:** contraste y tamaño de los botones y las pestañas.
- [ ] **«¿Olvidaste tu contraseña?»** con el teclado del celular y el botón atrás de Android.
- [ ] **Pantallas con sesión** (no se pudieron capturar sin credenciales):
  - detalle de un pedido con los modales de aceptar, enlace de pago, guía, rechazar y cancelar;
  - el panel de administración con solicitudes y sus modales;
  - «Mis productos» de la APK.
- [ ] **TalkBack** en la landing y en un modal.

## Siguiente paso
1. Atender la revisión.
2. Escribir `DESIGN.md` desde lo construido.
3. Commit y PR, cuando Cristopher lo pida.
4. Fase 3 (borradores y publicación) cuando `cu-02` y `cu-03` estén en `main`; ese día se retiran los alias de `tokens.css`.
