# PRP 014 — Integración final con identidad costera

- Caso de uso: CU-00 a CU-09; CU-14 es identificador de integración, no nuevo contrato.
- Responsable: Luis (integración autorizada) · Revisor: pendiente de revisión humana y recibo nativo
- Estado: en curso
- Rama: `cu-14/integracion-final`

## Objetivo
Unificar el último diseño costero de Chero con los flujos funcionales de Cristopher, Johann y Luis en una candidata separada. No modificar main ni eliminar ramas hasta aprobación explícita de Luis.

## Por qué
Preparar una demo coherente sin perder trabajo previo ni saltar controles de acreditación, sesión, publicación y estados de pedidos.

## Criterios de aceptación
- [ ] Identidad costera de Chero en web y APK; navegación móvil accesible, sin ocultar acciones.
- [ ] Ícono de Chero en favicon, marca y launcher Android adaptable/redondo.
- [ ] Borradores locales sobreviven fallas parciales, aparecen productos remotos por cuenta y se liberan blobs solo después de confirmación.
- [ ] Publicación exige acreditación real y no reporta éxito tras denegación.
- [ ] Pedidos mantienen acciones/estados actuales, chat y traducción segura.
- [ ] Términos compartidos legibles en web/APK; aceptación explícita versionada por cuenta, local solamente.
- [ ] Lint, tipos, pruebas, formato y ambos builds aprobados con resultados registrados.
- [ ] APK construida; prueba en dispositivo real pendiente si no disponible.
- [ ] Revisión nativa y humana antes de commit, publicación o promoción.

## Contexto necesario
- Dominio: `docs/dominio.md`; contratos existentes: `docs/contratos.md`.
- PRP 000–013 existentes; preservar PRP 013 y CC-16 de main.
- Chero: commits `9e70c08d8533aedec76e8132bdaf0cb969f9e8ef`, `3e47151d921a4874ad0d6610c4ec11d48c021c93`, base `a482505`. Extraer visuales/assets selectivamente, no sustituir el árbol.
- CU02/CU03: `b89e1cd`, `fe6f4a4`, `e49cb69`; fixes preparados de integración se leen desde worktree congelado sin modificarlo.
- Mantener `AccionesArtesano`, `AccionesComprador`, `acciones`, `estadoOrden`, `estimarEntrega`, Modal/Icono compartidos y seed vigente de Johann.
- Excluir bypass de RNA/UUID, reescritura de correo y falso éxito de publicar encontrados en fuente Chero.
- Chero `docs/prp/013--diseno-costero.md`, CC-16 alterno y traspaso se documentan como procedencia, no sobrescriben documentos homónimos vigentes.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear / modificar | `DESIGN.md` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/drawable/ic_launcher_background.xml` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png` | Integración autorizada; preservar contratos |
| crear / modificar | `android/app/src/main/res/values/ic_launcher_background.xml` | Integración autorizada; preservar contratos |
| crear / modificar | `docs/cambios/CC-19.md` | Integración autorizada; preservar contratos |
| crear / modificar | `docs/prp/014--integracion-final.md` | Integración autorizada; preservar contratos |
| crear / modificar | `docs/traspasos/CU-14-integracion-final.md` | Integración autorizada; preservar contratos |
| crear / modificar | `index.html` | Integración autorizada; preservar contratos |
| crear / modificar | `public/ayllu-favicon.svg` | Integración autorizada; preservar contratos |
| crear / modificar | `public/ayllu-icono.svg` | Integración autorizada; preservar contratos |
| crear / modificar | `public/editorial/PROVENANCE.md` | Integración autorizada; preservar contratos |
| crear / modificar | `public/editorial/costa.png` | Integración autorizada; preservar contratos |
| crear / modificar | `public/editorial/oficio.png` | Integración autorizada; preservar contratos |
| crear / modificar | `src/acceso/perfil.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/acceso/rutas.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/app/AppArtesano.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/app/AppWeb.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/app/app.test.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/app/artesano.css` | Integración autorizada; preservar contratos |
| crear / modificar | `src/app/web.css` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/EditorBorrador.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/MisProductos.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/borradores.css` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/db.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/rutas.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/sincronizar.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/borradores/sincronizar.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/compartido/Terminos.test.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/compartido/Terminos.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/compartido/terminos.css` | Integración autorizada; preservar contratos |
| crear / modificar | `src/compartido/aceptacionTerminos.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/compartido/aceptacionTerminos.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/compartido/ui/componentes.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/pedidos/DetalleOrden.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/pedidos/HiloMensajes.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/pedidos/MensajeTraducido.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/pedidos/estadoOrden.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/publicacion/RevisarProducto.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/publicacion/publicacion.css` | Integración autorizada; preservar contratos |
| crear / modificar | `src/publicacion/publicar.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `src/vitrina/Catalogo.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/vitrina/rutas.tsx` | Integración autorizada; preservar contratos |
| crear / modificar | `src/vitrina/vitrina.css` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/_compartido/ia.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/_compartido/ia.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/procesar-producto/ficha.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/procesar-producto/ficha.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/procesar-producto/fotos.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/procesar-producto/index.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/traducir-mensaje/traduccion.test.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/functions/traducir-mensaje/traduccion.ts` | Integración autorizada; preservar contratos |
| crear / modificar | `supabase/tests/producto_ia.test.sql` | Integración autorizada; preservar contratos |

| crear / modificar | `infra/litellm/.env.example` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `infra/litellm/README.md` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `infra/litellm/compose.yaml` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `infra/litellm/config.yaml` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `docs/traspasos/CU-09-cristopher.md` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `android/app/capacitor.build.gradle` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `android/capacitor.settings.gradle` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `android/app/src/main/assets/capacitor.config.json` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `android/app/src/main/assets/capacitor.plugins.json` | Ampliación aprobada por orquestador, derivada del alcance de Luis |
| crear / modificar | `android/app/src/main/assets/public/* (generado ignorado, evidencia de build)` | Ampliación aprobada por orquestador, derivada del alcance de Luis |

| crear / modificar | `supabase/functions/traducir-mensaje/index.ts` | Handler CU08 existente en fuente; ampliación explícita autorizada |
| modificar | `android/.gitignore` | Excluir sesión generada Kotlin local, sin borrar empaquetado |

| crear / modificar | `capacitor.config.ts` | Safe-area nativo aprobado |
| crear / modificar | `vite.config.ts` | Guard de configuración pública en build aprobado |
| crear / modificar | `.env.local` | Solo dos variables públicas suministradas; archivo local ignorado |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable antes de escribir.

## Tareas (en orden)
1. Registrar alcance/procedencia y preservar main/worktrees congelados.
2. Portar correcciones funcionales selectivas con pruebas de regresión.
3. Integrar presentación costera conservando autorizaciones y transiciones.
4. Compartir términos/aceptación local y generar launcher consistente.
5. Normalizar, ejecutar verificaciones y registrar pendientes reales.
6. Obtener revisión nativa/humana; esperar aprobación antes de promoción y limpieza.

## Validación
1. `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test -- --run`, `npm run build:web`, `npm run build:artesano` (equivalentes de make verify si GNU make ausente).
2. Vitest de sincronización, seguridad de publicación, términos por cuenta y traducción. SQL existente solo en entorno aislado autorizado, nunca base compartida.
3. `npx cap sync android` y `android/gradlew.bat assembleDebug` tras build artesano. No implica prueba de hardware.
4. Traspaso `docs/traspasos/CU-14-integracion-final.md`; revisión nativa bloqueada por selección de linaje previo CU06: no afirmar revisado/publicable.

## Fuera de alcance
- Cambios VPS/DB compartida, nuevas migraciones/RLS/contratos, IA pagada o despliegues.
- Integración de pagos, push remoto/en segundo plano y auditoría de consentimiento servidor.
- Commit/push/merge/borrado de ramas antes de aprobación.

## Notas / riesgos
- Términos son borrador informativo pendiente de aprobación legal humana, no asesoría legal; consentimiento local no prueba servidor.
- Notificaciones de Chero dependen de RLS adicional y persistencia global: se difieren, no se promete push.
- Cambios amplios superan presupuesto de PR pequeño; entrega permanece candidata sin commit hasta definir revisión/slices.

## Evidencia de implementación (no aprobación terminal)
- 271/271 pruebas, 24 archivos; lint 0 errores/7 avisos FastRefresh existentes, tipos y formato aprobados.
- Builds web/artesano aprobados; aviso de chunk >500 kB conocido, sin suprimir.
- APK debug compila con JDK21/Gradle8.14.3. No instalación ni ejecución en Android físico.
- Original INTEGRACION: 592 blobs normalizados coinciden con árbol congelado d537b1a228a39b18408d5c4cda6a2bf7168a3174. No mutación de configuración/procedencia/revisión antigua.
- Pruebas SQL remotas, OAuth, fotos/audio/hardware y proveedor IA real siguen pendientes; evidencia de tests anteriores aislados no equivale a ejecutarlos en esta candidata.
- Regresiones: publicación denegada no éxito; acreditación real no reemplazada por RNA demo; términos de cuenta A no pasan a B.

## Corrección acotada tras verificación runtime
El verificador confirmó 30 casos de navegador sin desborde y detectó marca web y enlace APK blancos sobre cal por reglas compartidas. Se corrigen únicamente selectores de web.css/artesano.css; términos y enlace de marca reciben objetivo de44px. Se agregaron tres assertions CSS en app.test.tsx. El primer intento raw produjo falso rojo del harness (Vitest sustituye CSS por vacío salvo tokens.css); se corrigió la lectura a readFileSync sin tocar configuración y sin afirmar ese fallo como RED de producto. Los defectos originales están probados por el verificador runtime. Sin nueva inspección visual ni ciclos de rediseño.

La APK ejecutada informó que faltan VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY. No se incrustó configuración ficticia ni secretos: los flujos autenticados están bloqueados hasta decisión de configuración real del usuario. Compilar no resuelve ese bloqueo.

El error safe-area se localizó en la dependencia @capacitor/android8.5.3, capacitor/src/main/java/com/getcapacitor/plugin/SystemBars.java:260–278. injectSafeAreaCSS evalúa document.documentElement.style sin guard/null-ready; los callbacks de WindowInsets lo invocan durante arranque. El mensaje coincide con las líneas del log. No proviene de estilos React nuevos y no se modifica dependencia/native fuera de alcance. La causa temporal exacta requiere diagnóstico autorizado; no se afirma resuelta.

## Revalidación final del lote CSS
274/274 pruebas en24archivos; formato, tipos y lint aprobados (7 avisos FastRefresh existentes), builds web/artesano aprobados. Tres assertions nuevas leen CSS fuente con node:fs y referencia local a tipos Node ya instalados; sin nueva dependencia ni cambio de tsconfig/Vitest.
Capacitor sync y assembleDebug ejecutados una vez tras este lote, aprobados. APK final SHA256: 97A2C415BEC7B8016FA7F853018609BF22C8CAB5B78ED651ED3CFCBBA21E750D. No nueva inspección visual, configuración real, despliegue ni revisión terminal. Falta decisión de configuración Supabase y diagnóstico nativo safe-area autorizado.

## Ampliación aprobada: configuración pública y safe-area
El usuario autorizó resolver los bloqueos implementables. El orquestador aprobó antes de escritura los archivos capacitor.config.ts y vite.config.ts, tests en src/app/app.test.tsx y .env.local ignorado solamente en BRAND. Se copian únicamente dos variables públicas VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY desde la configuración suministrada; nunca variables privilegiadas ni valores en logs/documentación/memoria.
Capacitor8.5.3: SystemBars.insetsHandling native preserva manejo nativo sin inyectar CSS sobre documentElement temprano; no disable, vendor patch ni upgrade. Viewport existente intacto. El guard de build verifica ambas variables y clase publicable/anon compatible, rechaza claves privilegiadas y falla sin revelar valores. No afecta comando test/dev; sin dependencias ni cambios en package/Makefile.
La fuente SQL actual fue verificada independientemente: ocho archivos/310 assertions y seed repetible en stack local aislado. Esta evidencia no incluye Storage/Edge ni proveedorIA. El writer no escribe DB y no prueba OAuth/IA reales.


## Estado vigente tras configuración pública y safe-area
Esta sección sustituye los bloqueos de configuración ausente y la APK histórica descritos arriba, sin borrar su trazabilidad. Se copió únicamente configuración pública suministrada a `.env.local`, confirmado ignorado. Assertions privadas prueban igualdad con la fuente autorizada y presencia de ambos valores en las salidas web/artesano y la APK; ningún valor aparece en documentación, logs o memoria.

SystemBars usa `insetsHandling: native` en la configuración fuente y empaquetada de Capacitor 8.5.3. Se evita la ruta de inyección CSS temprana identificada; viewport, dependencia y arquitectura permanecen intactos. Falta confirmar funcionalmente arranque frío, recarga, rotación y teclado en Android; esta configuración no prueba por sí sola el diseño correcto de insets.

Guard de build en Vite (ambos modos) falla antes de empaquetar si faltan variables, URL HTTP inválida o clave no pública. Conserva publishable y JWT con rol anon; rechaza sb_secret y service_role. No verifica firmas: esa validación corresponde a Supabase. Tests/dev no ejecutan el guard. RED: dos regresiones fallaron por configuración/helper ausentes; GREEN: 24 pruebas del archivo aprobadas. El primer import directo de Vite en jsdom se interrumpió por bloqueo de transformación del harness; se sustituyó por import real en proceso Node aislado, sin nuevas dependencias ni cambios de arquitectura.

Resultados finales: 276/276 pruebas en 24 archivos, tipos y formato aprobados, lint 0 errores/7 avisos FastRefresh existentes. Builds web/artesano aprobados; warning de chunk conocido. CLI negativa confirmó rechazo de configuración ausente en ambos modos sin valores. Capacitor sync y assembleDebug ejecutados una vez tras configuración final: aprobados (Gradle 42 s).

APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`, 14 692 615 bytes, SHA256 `0DDA183AFED15143C961BEADCD56C35DA0158B1F38B64A0DDBEBA16E20C3F115`. Logs locales: TEMP/ayllu-config-{types,lint,format,tests,web,artesano,cap-sync,apk}.log; assertions privadas: TEMP/ayllu-packaged-private.py. Inventario actual: TEMP/ayllu-config-filelist.txt.

Original INTEGRACION comprobado de nuevo: 592 blobs, cero diferencias contra `d537b1a228a39b18408d5c4cda6a2bf7168a3174`. Solo candidato BRAND modificado; sin commit, push, main, borrado de ramas, despliegue, escritura DB, revisión START ni receipt. Pendientes: verificación funcional Android y E2E aislada, Storage/Edge/IA remotos, OAuth real, aprobación legal de términos, despliegue y autorización humana de main/limpieza. Push remoto y consentimiento servidor siguen fuera de alcance aprobado.
