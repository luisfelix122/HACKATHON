# Traspaso CU-12 — Esquema base y costuras

Implementación revisada técnicamente y preparada localmente. La integración remota, la aprobación humana y las pruebas de hardware siguen pendientes.

- Responsable: Cristopher. Fecha: 2026-10-10.
- Rama: `cu-12/esquema-base`.
- Base: `279fdee33b15278038d81c45bde8101eb35a87a8`, igual a `main` local; PRP 000 y 011 integrados.
- PRP: `docs/prp/012--esquema-base-y-costuras.md`. No se verificó que exista un PR GitHub número 12.
- GitHub: Cristopher autorizó subir la rama a `luisfelix122/HACKATHON` usando la sesión de `gh` de esta computadora. Sin merge ni despliegue.

## Archivos y decisiones

- Migraciones `0001_perfil.sql`, `0002_producto.sql`, `0003_orden.sql`, con sus tres suites en `supabase/tests/`: entidades, RLS, protección de columnas, fotos, buckets y Realtime.
- `src/compartido/dominio/{lugares,perfil,producto,orden}.ts`, `sesion.ts`, `sesion.test.ts` y `PantallaIngresoWeb.tsx`: contratos TypeScript y sesión del comprador.
- `src/app/{AppWeb,AppArtesano}.tsx`, `app.test.tsx`, los seis `rutas.tsx` de módulos y `src/pedidos/BotonPedir.tsx`: costuras y stub.
- `package.json`, `package-lock.json`, `vite.config.ts`, `src/test/setup.ts` y manifiesto Android: dependencias, pruebas y permisos.
- `supabase.ts` ya contenía `ayllu.auth` persistente y `main.tsx` ya separaba las apps por import dinámico; no se modificaron.
- Los Gradle generados `android/app/capacitor.build.gradle` y `android/capacitor.settings.gradle` registran voz, cámara y red. Su ampliación de alcance fue aprobada por Cristopher y registrada en `docs/cambios/CC-13.md`.
- Dependencias nuevas: cámara, red y voz para PRP 002; Zod para validación del PRP 003. Paquetes con licencia MIT; cámara/red del proyecto Capacitor y voz de capacitor-community. Voz declara peer `@capacitor/core >=7`; compila con Capacitor 8. Su funcionamiento exige prueba en dispositivo.

## Correcciones de revisión

1. Storage bloquea modificación y renombrado de `original.jpg`; el alta de la foto original exige la ruta canónica del contrato para impedir el bypass con otro nombre.
2. Un producto publicado conserva al menos una foto elegida. El trigger bloquea desmarcarla o borrarla y serializa las retiradas por producto.
3. «Salir» deshabilita la acción en curso, muestra errores de red y ofrece reintento.

Las pruebas nuevas fallaron antes de estas correcciones. No se dispone de evidencia histórica del TDD de las 79 pruebas SQL originales. El revisor de solo lectura con `.claude/agents/reviewer.md` emitió aprobación técnica final; la aprobación humana sigue pendiente.

## Evidencia

| Comprobación | Resultado |
| --- | --- |
| `make verify` | Exit 0: lint, formato, tipos y 73 pruebas Vitest |
| `make build` | Exit 0: web y artesano en salidas separadas |
| `make test-db`, antes de nuevas regresiones | Exit 0: 79 pruebas pgTAP |
| Nuevas regresiones antes de corregir | Fallo de deshabilitado de «Salir»; fallos SQL de última foto, modificación/renombrado de original y ruta no canónica |
| Migraciones y seed en base aislada | 0001–0003 completas y `supabase/seed.sql` aplicados sin errores desde `public` vacío |
| pgTAP final en base aislada | 22 de órdenes + 24 de perfiles + 39 de productos: 85 aprobadas, TAP sin `not ok` |
| APK | `npx cap sync android` y `gradlew.bat assembleDebug`: exit 0, BUILD SUCCESSFUL, cinco plugins registrados |
| Diff | `git diff --check` sin errores |

La base de comprobación `ayllu_prp012_check_20261010` se creó en el contenedor local `supabase_db_HACKATHON`, copiando únicamente el esquema de infraestructura. Sus migraciones y seed se aplicaron desde cero. Las pruebas se enviaron por stdin a `psql -U postgres -d ayllu_prp012_check_20261010 -v ON_ERROR_STOP=1 -At`, comprobando planes y resultados TAP. La BD compartida `postgres` no se reseteó ni se modificó. El comando estándar `make test-db` sigue apuntando a esa BD con la versión anterior; no se declara verde para las migraciones finales.

En Windows el `make apk` de esta terminal usa `cmd` y falla en `test`/sintaxis shell. Se ejecutaron sus pasos con PowerShell, `JAVA_HOME=C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot` y `ANDROID_HOME=C:/Users/crist/AppData/Local/Android/Sdk`. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Pendientes y siguiente paso

- Los dos Gradle están autorizados mediante CC-13.
- Aclarar con el responsable de contratos el reintento de la original: el contrato menciona subir con `upsert`, pero también prohíbe sobrescribir. La implementación protege la inmutabilidad; PRP 002 debe reutilizar la original existente al reintentar, sin reemplazar bytes. No se cambió el contrato ni se implementó el módulo.
- Aprobar humanamente el diff y revisar CI y combinación con `main` remoto antes del merge. Repositorio y sesión GitHub ya autorizados; no hacer merge sin autorización concreta.
- Google real: ingreso, retorno, persistencia al recargar y error de red. Playwright no está instalado en el Python disponible; no se aprobó el recorrido navegador.
- Android real: modo avión, sesión persistida, permisos de cámara/micrófono, voz y TalkBack. Compilar no demuestra estos comportamientos.
- No ejecutar `supabase db reset` sobre la BD compartida. Aplicar las migraciones finales únicamente con coordinación del responsable.

## Límite de reversión

La unidad CU-12 incluye sus migraciones/pruebas, sesión/tipos, rutas/stub y configuración listada arriba. Revertirla antes de que otros módulos dependan de ella. No borrar datos ni revertir migraciones en la BD compartida para deshacer el código. Los módulos A, B y C y sus RPC/pantallas quedan pendientes en sus respectivos PRP.
