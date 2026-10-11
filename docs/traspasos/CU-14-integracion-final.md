# CU-14 — Traspaso de integración

Candidata consolidada sin commit/push/merge/despliegue ni eliminación de ramas. Base remota main1712200. PRP014/CC19 vigentes. No revisión terminal: router bloqueado en linaje CU06 previo; sin START nuevo.

## Procedencia
- Chero 9e70c08/3e47151: activos, vitrina/catálogo y marco costero. Se preservan estilos funcionales de ficha/perfil. Fraunces usa la familia variable instalada.
- CU02/CU03/CU06/CU08: fuentes congeladas de INTEGRACION, portadas selectivamente; CU06 adaptado conservando acciones/iconos de main.
- CU09: cinco archivos preparados copiados sin lanzar infra/proxy/proveedor.
- Seed Johann vigente, Modal/Icono y acciones/estados/estimación de main intactos.
- Excluidos bypass de RNA/UUID, correo reescrito y falso éxito de publicación.
- Notificaciones diferidas: requieren RLS adicional y corrección de persistencia global. No prometer push remoto/background.
- Términos públicos web/APK: borrador legal, aceptación local por cuenta/versión; sin auditoría servidor.
- Launcher legacy/redondo/adaptativo generado del SVG Chero con sharp empaquetado. Sin dependencias nuevas; PNG legacy inspeccionado visualmente.

## Validación ejecutada
- Términos RED import faltante → GREEN 3 tests; UI pública/cambio cuenta 2 tests.
- Regresiones: perfil pendiente sigue pendiente con RNA demo; denegación de publicación retorna ok:false.
- typecheck, format:check, lint PASS (0 errores, 7 avisos FastRefresh existentes).
- Vitest PASS 271/271, 24 archivos. Warning jsdom scrollTo no implementado.
- Builds web/artesano PASS, aviso chunk >500 kB no suprimido.
- Capacitor sync PASS; Gradle8.14.3/JDK21 assembleDebug PASS, final incremental 5s.
- APK final 14.692.614 bytes: android/app/build/outputs/apk/debug/app-debug.apk.
- Detector Impeccable acotado [] y git diff --check PASS.
- No SQL/pgTAP, VPS, stack compartido ni IA pagada ejecutados en esta candidata.

## Inmutabilidad y alcance
CC19 registra omisión del handler CU08 untracked: se detuvo, se admitió explícitamente y se probó original antes de seguir. Los 592 blobs normalizados de INTEGRACION coinciden con árbol congelado d537b1a228a39b18408d5c4cda6a2bf7168a3174 (0 diferencias). Hash-object sin -w; sin escribir native-start/candidate.diff/procedencia antigua. Kotlin generado excluido por android/.gitignore; empaquetado conservado.

## Pendientes reales
- Inspección independiente acotada escritorio/móvil y shell APK, delegada por orquestador.
- Android físico: arranque, launcher, cámara/audio/permisos/offline.
- OAuth, flujos reales autenticados/RLS y proveedor IA. Aprobación legal humana del borrador.
- PRPs requieren evidencia real; no marcar completos puntos no ejecutados.
- Resolver selector/recibo nativo antes de commit/publicación/promoción. Luis aprueba antes de main/borrado.
- Candidata >400 líneas: estrategia de entrega/riesgo explícita pendiente.

## Reversión por unidades
Separar funcional CU02/CU03/CU06/CU08, presentación Chero, términos, launcher y cinco archivos CU09. Revertir solo candidata, nunca worktrees fuente. No retroceder acciones/estados vigentes al revertir presentación.

## Evidencia local
TEMP/ayllu-final-{types,lint,format,tests,web,artesano,cap-sync,apk}.log; TEMP/ayllu-final-original-proof.json; TEMP/ayllu-final-filelist.txt.

Servidores temporales web http://127.0.0.1:4178 (sesión98249), artesano http://127.0.0.1:4179 (sesión91488). Variables del proceso: URL Supabase http://127.0.0.1:54399 y clave ficticia sb_publishable_local_visual_only. Sin backend real ni credenciales persistidas; cerrar tras inspección.

## Memoria
Engram mem_save falló por proyecto ambiguo hackathon/hackathon-brand. No se inventó selección. PRP014/CC19/este traspaso preservan la entrega.

## Archivos candidatos exactos

- docs/cambios/CC-19.md
- docs/prp/014--integracion-final.md
- docs/traspasos/CU-09-cristopher.md
- docs/traspasos/CU-14-integracion-final.md
- infra/litellm/.env.example
- infra/litellm/README.md
- infra/litellm/compose.yaml
- infra/litellm/config.yaml
- public/ayllu-favicon.svg
- public/ayllu-icono.svg
- public/editorial/PROVENANCE.md
- public/editorial/costa.png
- public/editorial/oficio.png
- src/app/artesano.css
- src/app/web.css
- src/compartido/Terminos.test.tsx
- src/compartido/Terminos.tsx
- src/compartido/aceptacionTerminos.test.ts
- src/compartido/aceptacionTerminos.ts
- src/compartido/terminos.css
- src/pedidos/MensajeTraducido.tsx
- supabase/functions/traducir-mensaje/index.ts
- supabase/functions/traducir-mensaje/traduccion.test.ts
- supabase/functions/traducir-mensaje/traduccion.ts
- DESIGN.md
- android/.gitignore
- android/app/capacitor.build.gradle
- android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml
- android/app/src/main/res/drawable/ic_launcher_background.xml
- android/app/src/main/res/mipmap-hdpi/ic_launcher.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
- android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
- android/app/src/main/res/values/ic_launcher_background.xml
- android/capacitor.settings.gradle
- index.html
- src/acceso/perfil.test.ts
- src/acceso/rutas.tsx
- src/app/AppArtesano.tsx
- src/app/AppWeb.tsx
- src/app/app.test.tsx
- src/borradores/EditorBorrador.tsx
- src/borradores/MisProductos.tsx
- src/borradores/borradores.css
- src/borradores/db.ts
- src/borradores/rutas.tsx
- src/borradores/sincronizar.test.ts
- src/borradores/sincronizar.ts
- src/compartido/ui/componentes.tsx
- src/pedidos/DetalleOrden.tsx
- src/pedidos/HiloMensajes.tsx
- src/pedidos/estadoOrden.test.ts
- src/publicacion/RevisarProducto.tsx
- src/publicacion/publicacion.css
- src/publicacion/publicar.test.ts
- src/vitrina/Catalogo.tsx
- src/vitrina/rutas.tsx
- src/vitrina/vitrina.css
- supabase/functions/_compartido/ia.test.ts
- supabase/functions/_compartido/ia.ts
- supabase/functions/procesar-producto/ficha.test.ts
- supabase/functions/procesar-producto/ficha.ts
- supabase/functions/procesar-producto/fotos.test.ts
- supabase/functions/procesar-producto/index.ts
- supabase/tests/producto_ia.test.sql

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
