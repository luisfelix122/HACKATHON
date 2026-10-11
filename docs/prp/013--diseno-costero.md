# PRP 013 — Diseño costero de la web

- Caso de uso: CU-11; superficies de CU-04, CU-01, CU-05 y CU-06 (`docs/plan.md`).
- Responsable: solicitante de esta rama · Revisor: IA y persona del equipo pendiente.
- Estado: completado (implementación y revisión IA; revisión humana pendiente).
- Rama: `cu-11/diseno-costero`.

## Objetivo
Implementar la guía de diseño entregada por el usuario: identidad costera, cabecera clara, portada fotográfica, catálogo editorial y emblema dorado compartido por logo y favicon.

## Por qué
Mostrar el oficio y el origen de las piezas con una presentación reconocible, conservando el acceso y el flujo real de pedidos.

## Criterios de aceptación
- [x] Cabecera, inicio, catálogo, ficha, perfil, acceso y pedidos comparten paleta y tipografía.
- [x] Favicon dorado transparente como la pestaña adjunta; logo con sol, chalana y A entrelazada.
- [x] Navegación y filtros operativos; productos, disponibilidad y precios proceden de Supabase.
- [x] Portada con paisaje y proceso editorial; imágenes ilustrativas identificadas, sin atribución a un lugar o artesano real.
- [x] Móvil de 360 px, escritorio, teclado, estados vacíos/error y movimiento reducido.
- [x] Verificación y compilación ejecutadas; limitaciones registradas.

## Contexto necesario
- Dominio: `docs/dominio.md`: producto, artesano, lugar, orden.
- Contratos: `docs/contratos.md`; no se modifican entidades, consultas ni transiciones.
- Decisiones: 0001 y 0004; actualización visual registrada en CC-16.
- Código: `Catalogo.tsx`, componentes compartidos y `AppWeb.tsx`.
- Referencia: guía Markdown y captura entregadas el 2026-10-11.
- Trampas: existen cambios locales previos en acceso, borradores, publicación y pedidos. No incluirlos como trabajo de este PRP.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `docs/prp/013--diseno-costero.md` | PRP |
| crear | `docs/cambios/CC-16.md` | Registro del rediseño solicitado |
| modificar | `DESIGN.md` | Núcleo: documentación visual |
| crear | `docs/traspasos/CU-11-diseno-costero.md` | Evidencia y revisión |
| modificar | `src/app/AppWeb.tsx` | Núcleo: marco y navegación |
| crear | `src/app/web.css` | Núcleo: identidad solo web |
| modificar | `src/compartido/ui/componentes.tsx` | Núcleo: logo |
| modificar | `src/vitrina/Catalogo.tsx` | B: inicio y catálogo |
| modificar | `src/vitrina/vitrina.css` | B: composición |
| modificar | `src/vitrina/rutas.tsx` | B: ruta de catálogo |
| modificar | `index.html` | Núcleo: favicon y metadatos |
| modificar | `package.json`, `package-lock.json` | Núcleo: Fraunces local |
| crear | `public/ayllu-icono.svg`, `public/ayllu-favicon.svg` | Emblema vectorial |
| crear | `public/editorial/costa.png`, `public/editorial/oficio.png` | Imágenes editoriales |
| crear | `public/editorial/PROVENANCE.md` | Origen y prompts de imágenes |
| crear | `.impeccable/review/desktop.png`, `.impeccable/review/mobile.png`, `.impeccable/review/hero-repro.png` | Evidencia visual |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Registrar dirección y crear la rama.
2. Crear emblema, fuentes y activos editoriales.
3. Adaptar marco web e inicio conservando contratos.
4. Ajustar catálogo, ficha y superficies compartidas mediante CSS solo web.
5. Ejecutar validación, inspección visual y revisión IA; registrar traspaso.

## Validación
1. `make verify`; si GNU make no existe, ejecutar sus cuatro comandos npm sin omitir ninguno. Compilar `npm run build:web` y `npm run build:artesano`.
2. Reutilizar pruebas funcionales y contraste existentes; no hay lógica dura nueva.
3. Manual: escritorio y 360 px; navegación, filtros, foco y respuesta al fallo de conexión.
4. Revisor con `.claude/agents/reviewer.md`, PRP, contratos, diff y resultados.

## Fuera de alcance
- Despliegue, VPS, cambios de base de datos o seed; fotos de productos ficticios.
- Cambios funcionales en pagos, autenticación o APK.

## Notas / riesgos
- Aviso de coordinación: esta solicitud abarca presentación del núcleo (Cristopher) y vitrina (Persona B sin asignar). Se registra antes de editar; la autorización es la petición directa del usuario de implementar la guía completa.
- `@fontsource/fraunces`: fuente local, licencia OFL-1.1, mantenida por Fontsource; evita CDN en ejecución.
- No se abre PR ni se despliega en esta tarea; revisión humana pendiente.
