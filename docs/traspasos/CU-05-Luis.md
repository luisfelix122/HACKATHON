# CU-05 — Traspaso de Luis

## Estado y rama

Implementación local del PRP 005, **no aprobada ni lista para integrar**.
Rama: `cu-05/pedido-despacho`. Base: `e423dc1` (PRP 012 presente).
No se hicieron commits, push, merge, despliegues ni cambios en una BD compartida.
PRP 006 y 008 no implementados en este traspaso.

## Archivos propios

- `src/pedidos/BotonPedir.tsx`, `rutas.tsx` (costuras reemplazadas).
- `src/pedidos/datosEnvio.ts`, `datosEnvio.test.ts`, `consultas.ts`, `tiempoReal.ts`.
- `src/pedidos/FormularioPedido.tsx`, `MisPedidos.tsx`, `DetalleOrden.tsx`, `HiloMensajes.tsx`, `pedidos.css`.
- `supabase/migrations/0301_crear_orden.sql`, `supabase/tests/orden_crear.test.sql`.
- Este traspaso, autorizado para CU-05.
- `src/app/app.test.tsx`: excepción de alcance autorizada por Luis; se aplicó únicamente el diff enviado por Cristopher (MemoryRouter y expectativa OAuth actual).

## Decisiones

- Crear orden solo por RPC: actor de `auth.uid()`, rol comprador, producto publicado, cantidad válida, despacho estructurado y estado inicial solicitado. Sin total ni reserva de stock.
- Bloqueo `FOR SHARE` de producto para evitar retirar/publicar concurrentemente durante la solicitud; no modifica disponibilidad.
- Mensajes: `getUser()` obtiene el autor; RLS compartida impide suplantación y acceso de terceros. Nunca se envían fecha ni traducciones desde el cliente.
- Google conserva la ficha y el formulario mediante el parámetro `pedir=<productoId>`; no cambia la firma del botón que importa el módulo B.
- Realtime de la orden abierta e INSERT del hilo; cancelar canal al salir. Actualizar vuelve a consultar y reintenta la suscripción.
- Acuerdo y despacho se muestran desde la orden, separados del hilo. UI en español, con componentes y tokens compartidos, sin DNI.

## Pruebas y resultados

Runtime: Node **24.19.0** ya disponible en el runtime empaquetado de Codex. El Node predeterminado 24.11.0 genera advertencias de motor para jsdom; no se modificó la configuración del proyecto.

- RED antes de implementar: `vitest run src/pedidos/datosEnvio.test.ts` falló al resolver `./datosEnvio`, entonces inexistente. Primera ejecución SQL aislada: falló `publicado_completo` porque el fixture de producto publicado omitía `ficha`; solo se completó ese fixture conforme al contrato, sin cambiar restricciones ni debilitar pruebas.
- GREEN final de CU-05: `npm run test -- --run src/pedidos/datosEnvio.test.ts`: **13 pruebas aprobadas** (campos obligatorios, recojo, cantidad, mensajes, actor verificado, RPC, filtros y cancelación Realtime).
- `npm run lint`: aprobado.
- `npm run format:check`: aprobado; se vuelve a ejecutar tras normalizar este traspaso.
- `npm run typecheck`: aprobado.
- Suite completa `npm run test -- --run`: **86/86 aprobadas**, 4 archivos. La prueba antigua del stub queda sustituida por el diff de Cristopher, autorizado expresamente por Luis: usa MemoryRouter y comprueba Google conservando ficha, filtro y pedido.
- `npm run build:web`: aprobado, 89 módulos.
- `npm run build:artesano`: aprobado, 88 módulos.
- GNU make no está en PATH: `make verify`, `make build`, `make apk` y `make test-db` no se ejecutaron. Se ejecutaron y aprobaron sus controles reales npm de lint, formato, tipos, tests y ambos builds, sin desactivar controles. El build artesano es web, no una compilación APK.
- Supabase CLI **2.120.0**, stack local aislado propio `ayllu-cu05-isolated`, con migraciones compartidas y 0301: `npx --yes supabase@2.120.0 test db --local --workdir <directorio temporal aislado>` aprobado: **100/100 aserciones pgTAP**, 4 archivos (15 CU-05 + 85 de base). RPC, RLS y restricciones se ejecutaron contra Postgres real; las transacciones de pruebas se revierten. No se accedió ni reseteó la BD compartida.
- `npm ci`: realizado sin modificar lockfile; reporta 3 vulnerabilidades moderadas. Sin actualizaciones automáticas por estar congeladas las dependencias.

## Bloqueo y siguiente paso

El bloqueo automatizado de la prueba del núcleo está resuelto por el diff de Cristopher autorizado por Luis; los controles npm y pgTAP están aprobados.
Pendiente: revisión del candidato actualizado por el procedimiento del orquestador y recibo válido antes de commit/push. La revisión previa no aprobó el candidato; no debe reutilizarse como evidencia de aprobación tras estas correcciones.
La vitrina todavía no integra el botón real en este checkout; esa integración pertenece al responsable de CU-04. No se implementa dentro de CU-05 ni se declara aprobado el recorrido completo.

## Pruebas manuales pendientes

No hay skill `webapp-testing` preparada en este checkout. Nada de esta sección está aprobado:

- La aplicación de migraciones y pgTAP en Supabase local aislado ya están aprobadas; no sustituyen la integración de navegadores, OAuth ni APK real.
- Integración con PRP 004 y 001: visitante → Google → misma ficha/formulario; perfil comprador; persistencia al recargar.
- Dos dispositivos: comprador web → pedido con envío → artesano APK en Mis pedidos → hilo en ambos sentidos; cambios de estado de CU-06 sin recarga.
- Mensaje inválido, fallo de red conservando el texto y destino, fallo de Realtime con Actualizar; salir y volver sin canales acumulados.
- Orden ajena denegada en API/UI; sin exposición de totales ni mensajes de otra sesión.
- APK real: compilación con JDK/SDK, instalación, teclado, accesibilidad y ancho 360 px.

## Límite de reversión

Revertir únicamente los archivos de CU-05 listados arriba, restaurando las dos costuras a su base si corresponde. No revertir cambios de compañeros ni núcleo/contratos. Si se aplicó 0301 en un entorno aislado, su reversión debe coordinarse: retirar solo `public.crear_orden(uuid,integer,text,jsonb,text)`, nunca tablas/datos compartidos ni resetear la BD compartida.
