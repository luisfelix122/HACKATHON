# PRP 012 — Esquema base y costuras para trabajar en paralelo (Fase 0)

- Caso de uso: CU-12 (`docs/plan.md`, transversal)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (CC-11). Se ejecuta después de los PRP 000 y 011 y **antes** de abrir los módulos A, B y C (`docs/modulos.md`)
- Rama: `cu-12/esquema-base`

## Objetivo
Dejar en `main` todo lo que comparten los módulos, para que después tres personas implementen sus PRP en paralelo sin tocar el mismo archivo:
1. **Esquema de datos completo** del contrato: tablas, tipos, RLS, triggers de protección, buckets y Realtime. Los módulos solo agregan funciones, vistas y triggers en su propio bloque de migraciones.
2. **Tipos de dominio** en TypeScript para todas las entidades.
3. **Sesión común:** cliente Supabase, sesión actual, ingreso con Google en la web, alta del perfil `comprador` y pantalla de ingreso web.
4. **Costuras:**
   - **Rutas:** `AppWeb` y `AppArtesano` arman sus rutas desde un archivo `rutas.tsx` por módulo, que empieza vacío.
   - **Estilos:** cada módulo trae su propio CSS.
   - **Componente `BotonPedir`:** un stub que la vitrina importa y el módulo de pedidos implementa.
5. **Configuración compartida cerrada:**
   - Todas las dependencias de npm del proyecto.
   - Todos los permisos y el deep link del `AndroidManifest`.
   - Vitest incluye las pruebas de las Edge Functions.

## Por qué
Sin esta fase, 11 archivos los modifican dos o más PRP (`AppWeb.tsx`, `AppArtesano.tsx`, `estilos.css`, `package.json`, `main.tsx`, `AndroidManifest.xml`, `README.md`, `vite.config.ts`, `seed.sql`, `FichaProducto.tsx` y `app.test.tsx`). Además, las migraciones dependen unas de otras entre módulos. Con esta fase, cada módulo escribe solo en sus carpetas (CC-11).

## Criterios de aceptación
- [ ] `supabase db reset` aplica las migraciones 0001–0003 y `supabase/seed.sql` sin errores. La vitrina y los pedidos tienen datos desde el primer día.
- [ ] Las migraciones crean exactamente las tablas, tipos, restricciones y buckets de `docs/contratos.md` (`perfil`, `producto`, `foto_producto`, `orden`, `mensaje_orden`, `fotos`, `audios`).
- [ ] RLS y triggers de protección, con pruebas pgTAP que **fallan antes de implementarlos**:
  - Un usuario no puede asignarse `rol = admin` ni cambiar su `acreditacion` (`proteger_perfil`).
  - Un anónimo solo lee los campos públicos de los artesanos `aprobada` (vista `artesano_publico`).
  - Un artesano no edita productos ajenos ni las columnas de la IA, y no borra su foto original (`proteger_producto`).
  - No se publica sin acreditación `aprobada`, con `revision_ia = rechazada` ni sin una foto publicada (`exigir_acreditacion_para_publicar`).
  - Nadie lee órdenes ni mensajes ajenos, y no existe política de `update` sobre `orden`.
- [ ] `orden` y `mensaje_orden` están en la publicación `supabase_realtime`.
- [ ] `src/compartido/dominio/` exporta los tipos y listas de `perfil`, `producto` (con `Ficha`, `Costeo`, `FotoProducto`), `orden` (con `DatosEnvio`, `MensajeOrden`) y `lugares`, tomados de los contratos.
- [ ] `src/compartido/sesion.ts`:
  - Sesión actual y suscripción a sus cambios.
  - `iniciarSesionGoogle(volverA)` en la web y `cerrarSesion()`.
  - `asegurarPerfilComprador()`, que hace el `insert` del perfil `comprador` en el primer ingreso web.
  - Tiene pruebas con Supabase simulado.
- [ ] La sesión se guarda con la clave fija `ayllu.auth` y persiste (CC-04).
- [ ] `/ingresar` en la web muestra «Continuar con Google» y vuelve a la ruta de origen.
- [ ] `AppWeb` y `AppArtesano` arman sus rutas y su menú solo desde los `rutas.tsx` de los módulos. Agregar una ruta nunca obliga a editar `src/app/`. Hay una prueba de que una ruta declarada en un módulo aparece.
- [ ] `src/pedidos/BotonPedir.tsx` existe como stub (botón «Pedir» deshabilitado con el texto «Muy pronto»), con la firma `BotonPedir({ productoId })`.
- [ ] `package.json` incluye todas las dependencias que piden los PRP 001–008:
  - `@capacitor/camera`, `@capacitor/network` y `@capacitor-community/speech-recognition`.
  - `zod`.
  - Las que ya trae el PRP 000.
  - Ningún módulo vuelve a tocar `package.json`.
- [ ] `AndroidManifest.xml` tiene los permisos `CAMERA` y `RECORD_AUDIO` y el `intent-filter` de `pe.ayllu.artesano://auth` (CC-06).
- [ ] `vite.config.ts` incluye `supabase/functions/**/*.test.ts` en Vitest.
- [ ] `src/test/setup.ts` limpia el DOM entre pruebas.
- [ ] `make verify`, `make build` y `make test-db` en verde.

## Contexto necesario
- **Dominio:** todo el glosario; reglas 1, 2, 3, 10 y 12.
- **Contratos:** `docs/contratos.md` completo (§Normalización, §Entidades, §Archivos, §Acceso, §Permisos, §Transiciones de orden → Realtime).
- **Decisiones:** `0001`, `0003`, CC-04, CC-06, CC-09, CC-10, CC-11.
- **Código existente a imitar:** lo que dejaron los PRP 000 y 011; `supabase/seed.sql` (la muestra debe cargar sin cambios).
- **Documentación externa:**
  - https://supabase.com/docs/guides/database/postgres/row-level-security
  - https://supabase.com/docs/guides/storage/security/access-control
  - https://supabase.com/docs/guides/realtime/postgres-changes
  - https://reactrouter.com/en/main/routers/create-browser-router
- **Trampas conocidas:**
  - **Bloques de migraciones por módulo:** el núcleo usa del 0001 al 0099, el módulo A del 0101 al 0199, el B del 0201 al 0299 y el C del 0301 al 0399. Una migración de un módulo solo depende del núcleo, nunca de otro módulo.
  - **Costuras mínimas:** cada `rutas.tsx` de módulo exporta `rutasWeb`, `rutasArtesano` y `menuArtesano` (arreglos, vacíos al empezar). No meter lógica de un módulo en `src/app/`.
  - **No adelantar trabajo de los módulos:** aquí no van las RPC de órdenes, las vistas de la vitrina, la función de IA ni las pantallas de los módulos.
  - **Columnas protegidas:** usar triggers `before update` que comparan `old` y `new`, salvo que quien llama sea `service_role` o admin.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0001_perfil.sql` | tipos `rol` y `acreditacion`; tabla `perfil`; RLS; trigger `proteger_perfil`; vista `artesano_publico`; función `es_artesano_aprobado(uuid)` |
| crear | `supabase/migrations/0002_producto.sql` | tipos `estado_producto`, `disponibilidad`, `revision_ia`, `origen_foto`, `variante_foto`; tablas `producto` y `foto_producto`; RLS; triggers `proteger_producto` y `exigir_acreditacion_para_publicar`; buckets `fotos` y `audios` con políticas |
| crear | `supabase/migrations/0003_orden.sql` | tipos `modalidad` y `estado_orden`; tablas `orden` y `mensaje_orden`; RLS por unión con `producto`; publicación `supabase_realtime` |
| crear | `supabase/tests/perfil.test.sql`, `supabase/tests/producto.test.sql`, `supabase/tests/orden_rls.test.sql` | pgTAP de los criterios de RLS y protección |
| crear | `src/compartido/dominio/lugares.ts`, `perfil.ts`, `producto.ts`, `orden.ts` | tipos y listas del contrato |
| modificar | `src/compartido/supabase.ts` | clave fija `ayllu.auth` y sesión persistente |
| crear | `src/compartido/sesion.ts`, `src/compartido/sesion.test.ts` | sesión común, Google web, alta del comprador |
| crear | `src/compartido/PantallaIngresoWeb.tsx` | «Continuar con Google» en `/ingresar` |
| modificar | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx`, `src/app/app.test.tsx` | armar rutas y menú desde los módulos; prueba de la costura |
| crear | `src/acceso/rutas.tsx`, `src/admin/rutas.tsx`, `src/borradores/rutas.tsx`, `src/publicacion/rutas.tsx`, `src/vitrina/rutas.tsx`, `src/pedidos/rutas.tsx` | costuras vacías; luego cada una pertenece a su módulo |
| crear | `src/pedidos/BotonPedir.tsx` | stub; luego pertenece al módulo C |
| modificar | `src/main.tsx` | import dinámico de cada app por modo (la web no incluye Capacitor) |
| modificar | `package.json`, `package-lock.json` | todas las dependencias de los PRP 001–008 |
| modificar | `android/app/src/main/AndroidManifest.xml` | permisos `CAMERA`, `RECORD_AUDIO` e `intent-filter` del deep link |
| modificar | `vite.config.ts` | pruebas de `supabase/functions/**` |
| crear | `src/test/setup.ts` | limpieza del DOM entre pruebas |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Pruebas pgTAP primero (TDD); luego las migraciones 0001–0003 hasta que pasen. Comprobar que `seed.sql` carga.
2. Tipos de dominio.
3. `supabase.ts`, `sesion.ts` con sus pruebas, y `PantallaIngresoWeb`.
4. Costuras: los `rutas.tsx` vacíos, `AppWeb`/`AppArtesano` y la prueba; `BotonPedir` stub.
5. Dependencias, manifiesto, `vite.config.ts`, `setup.ts`, `main.tsx`.
6. `make verify`, `make build`, `make test-db` y `make apk`.

## Validación
1. `make verify`, `make build` y `make test-db`.
2. **Pruebas a crear:** las pgTAP de RLS y protección; `sesion` (alta del comprador una sola vez, error de red); la costura de rutas.
3. **Prueba manual:** `supabase start` + `supabase db reset` → la base tiene la muestra; la web entra con Google y vuelve a la ruta de origen; la APK abre en modo avión.

## Fuera de alcance
- Las RPC, vistas, funciones y pantallas de los módulos A, B y C.
- El registro y el ingreso del artesano en la APK (módulo A, PRP 001).

## Notas / riesgos
- Después de este PRP, `src/app/`, `src/compartido/`, `package.json`, `vite.config.ts`, `AndroidManifest.xml` y las migraciones 0001–0099 quedan **congelados**. Un cambio ahí exige un PR propio del responsable y aviso a los tres módulos.
