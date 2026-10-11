# Traspaso CU-02 — Borrador de producto sin conexión (PRP 002)

- **Responsable:** Cristopher
- **Rama:** `cu-02/borrador-sin-conexion`, desde `cu-01/acceso-acreditacion` (`969d426`)
- **PRP:** `docs/prp/002--borrador-sin-conexion.md`
- **Dependencias integradas:** PRP 012 (`6dd693d`) y PRP 001 (`969d426`)
- **Fecha:** 2026-10-10

## Archivos
Todos corresponden estrictamente a la tabla «Archivos» del PRP 002:

| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `src/borradores/costeo.ts` | Funciones de costeo: `calcularCosto`, `calcularPrecioSugerido`, redondeo estándar de .005 a 2 decimales en soles, detección de pérdida (`esPrecioMenorQueCosto`) y validaciones de datos (costos no negativos, precio > 0, disponibilidad). |
| crear | `src/borradores/costeo.test.ts` | Batería de pruebas unitarias de costeo: caso feliz, redondeo de centavos, campos ausentes, aviso de pérdida y validaciones de disponibilidad y longitud. |
| crear | `src/borradores/db.ts` | Base de datos local IndexedDB/Dexie (`borradores`), solicitud de almacenamiento persistente (`navigator.storage.persist()`) y métodos CRUD seguros ante entornos sin IndexedDB. |
| crear | `src/borradores/comprimirFoto.ts` | Compresión de fotografías en el cliente escalando proporcionalmente a un máximo de 1600 px en su lado mayor y formato JPEG con calidad 0.8 según `docs/contratos.md`. |
| crear | `src/borradores/audio.ts` | Captura de audio local con `MediaRecorder` en modo sin conexión y transcripción por voz en vivo mediante SpeechRecognition (`es-PE` con respaldo `es-ES`) cuando hay señal; detector reactivo de estado de red. |
| crear | `src/borradores/sincronizar.ts` | Proceso idempotente de subida a Supabase: sube foto original a Storage bucket `fotos`, audio a bucket `audios`, ejecuta `upsert` en tabla `producto` con el mismo ID local y `upsert` en `foto_producto` como original publicada. |
| crear | `src/borradores/sincronizar.test.ts` | Pruebas de integración con cliente Supabase simulado: sincronización exitosa, falla en subida de foto, falla en registro de producto, falla en foto_producto e idempotencia de reintentos. |
| crear | `src/borradores/Calculadora.tsx` | Componente interactivo de calculadora de costos: inputs grandes en soles para materiales, tiempo, tarifa por hora, otros gastos y ganancia; muestra costo total y precio sugerido, con aviso visible «Con este precio pierdes dinero» sin bloquear. |
| crear | `src/borradores/EditorBorrador.tsx` | Formulario guiado por pasos (Nombre → Foto → Descripción/Audio → Precio/Calculadora → Disponibilidad → Guardar) diseñado para artesanos con poca destreza digital; guarda en IndexedDB y dispara sincronización en segundo plano si hay red. |
| crear | `src/borradores/MisProductos.tsx` | Pantalla principal de la APK con listado de borradores locales, estados («Guardado en el celular», «Sincronizado», «Error al sincronizar»), botón «Nuevo», botón «Sincronizar» manual y sincronización automática reactiva al recuperar la señal de red. |
| modificar | `src/borradores/rutas.tsx` | Costuras de navegación de la APK: registra rutas `/`, `/nuevo`, `/borrador/:id` y elemento «Mis productos» en la barra de navegación del artesano. |
| crear | `src/borradores/borradores.css` | Estilos para la botonera táctil, pasos guiados, tarjeta de calculadora, grabador de audio y rejilla de productos, usando los tokens de diseño (`tokens.css`) y alturas mínimas táctiles ($\ge 48\text{px}$). |
| crear | `docs/traspasos/CU-02-cristopher.md` | Documento de traspaso de la tarea (este archivo). |

## Decisiones
- **Resiliencia offline estricta (Modo Avión):** la creación, edición y guardado de borradores se realiza completamente en el almacenamiento local del dispositivo mediante Dexie (`IndexedDB`), con solicitud de almacenamiento persistente (`navigator.storage.persist()`). El artesano puede trabajar sin conexión en caletas con baja cobertura.
- **Normalización 3FN:** el precio sugerido se calcula de forma reactiva en el cliente y **no** se persiste en la base de datos (CC-09). En la base de datos únicamente se almacena el desglose `costeo` (`{ materiales, horas, pago_hora, gastos, ganancia }`) y el `precio_final` fijado por el artesano.
- **Aviso de pérdida no bloqueante:** si el artesano define un precio menor a sus costos de producción, la interfaz muestra de manera destacada «Con este precio pierdes dinero», pero no le bloquea el guardado ni la publicación (criterio 2 y CC-09).
- **Sincronización idempotente y segura:** el ID del producto y de la foto original se generan con UUID v4 en el cliente al momento de crear el borrador local. Al recuperar la señal, las subidas a Storage y las inserciones en Postgres usan `upsert`, lo que garantiza que reintentos o desconexiones a mitad del proceso nunca dupliquen filas ni archivos.
- **UX accesible para baja destreza digital:** el editor se diseñó con avance paso a paso (un solo foco por pantalla), controles numéricos grandes con prefijo en soles (S/), botones de cámara/galería claros y alternativa de dictado online o grabación de voz offline con reproductor incorporado.

## Pruebas y resultados
| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | exit 0; 0 errores, 0 advertencias |
| `npm run format:check` | exit 0; 100% código formateado con Prettier |
| `npm run typecheck` | exit 0; TypeScript estricto sin errores |
| `npm run test -- --run` | exit 0; 85 pruebas pasan (9 suites: `costeo`, `sincronizar`, `perfil`, `sesionArtesano`, `googleApk`, `rutas`, `sesion`, `componentes`, `app`) |
| `npm run build:web` | exit 0; genera `dist-web/` |
| `npm run build:artesano` | exit 0; genera `dist-artesano/` optimizado para Capacitor |
| Revisión con el subagente `reviewer` | Ciclo 1: 7 observaciones atendidas (omisión de campos de IA en upsert, preservación de foto_id/audio_ruta/creado_en al editar, corrección de acumulación en dictado por voz, verificación de resultados en lote, filtro de no sincronizados, tabla canónica borrador_local y propagación de errores). Veredicto: **aprobar** |

## Bloqueos
- **Dispositivo físico Android:** las capacidades nativas de cámara mediante Capacitor Camera, el reconocimiento de voz con SpeechRecognition y la grabación con MediaRecorder en WebView requieren prueba en un dispositivo Android real o emulador con periféricos configurados.

## Pruebas manuales pendientes
- [ ] Crear un borrador completo con foto y audio en la APK en modo avión dentro de un dispositivo Android físico, cerrar y reabrir la app para comprobar que se mantenga intacto.
- [ ] Desactivar el modo avión y verificar que el borrador pase automáticamente a «Sincronizado», comprobando que los archivos existan en Storage y las filas en las tablas `producto` y `foto_producto`.
- [ ] Probar el dictado en vivo en español (`es-PE`) en un teléfono Android.

## Siguiente paso
- Continuar con el Módulo A con el PRP 003 (Procesar producto con IA: Edge Function `procesar-producto`, generación de ficha técnica y variantes de imagen).


## Correcciones de integración, 2026-10-11

Rama cu-02/correcciones-integracion desde main 1a891e2, conservando código de Chero.
Se protege inicio/editor con sesión APK y perfil; se retira / duplicado de acceso.
Se reutiliza original.jpg sin sobrescribir, comprobando sus bytes ante duplicado.
Las filas se insertan sin restaurar estados de IA y se confirma su contenido
antes de borrar. El primer intento bloquea edición; la cola evita doble envío.
La lista escucha Dexie y enlaza productos sincronizados a Revisar y publicar.
TDD: tres fallos reproducidos antes de corregir; 29 pruebas enfocadas pasan; verify 188 pruebas, build y APK aprobados.
Browser con mocks: guard, inicio, reintento y enlace a revisión aprobados.
Pendientes: Android real y SQL/pgTAP con Johann, sin tocar BD compartida.
Rollback: revertir este PR restaura únicamente guardas, cola y costura de CU02.
