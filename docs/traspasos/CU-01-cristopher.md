# Traspaso CU-01 — Acceso y acreditación

- Rama: `cu-01/acceso-acreditacion` (sobre `cu-00/base-web-apk`)
- PRP: `docs/prp/001--acceso-y-acreditacion.md` · Cambios: CC-03 (login del artesano), CC-04 (ajustes, **pendiente de confirmar**)

## Hecho
- Migración `supabase/migrations/0001_perfil.sql`:
  - Tabla `perfil`, RLS y trigger `proteger_perfil`.
  - RPC `resolver_acreditacion` (solo admin) y vista `artesano_publico`.
- Pruebas pgTAP `supabase/tests/perfil.test.sql` (15 aserciones): alta como admin, autoaprobación, nota falsa, lectura y edición de perfiles ajenos, visitante, admin y RNA corregido.
- **Web:**
  - `/ingresar`: comprador con Google.
  - `/artesano/registro`: Google, contraseña y perfil, con formulario para cambiar la contraseña.
  - `/admin`: panel de acreditación.
- **APK:**
  - Ingreso con correo y contraseña; se rechaza a quien no es artesano y se muestra el motivo.
  - La sesión y una copia local del perfil se guardan para abrir sin conexión.
- Revisión con el subagente `reviewer`: cambios requeridos. Corregidos los hallazgos 1–4, 6, 7, 9, 11 y 12; el 5 quedó registrado como CC-04; el 8 se resolvió con la RPC.

## Resultados reales
- `make verify`: exit 0 (eslint, prettier, tsc, Vitest con 14 pruebas).
- `make build`: web y artesano compilan.

## Pendiente (no ejecutado)
- `make test-db`: Docker Desktop no estaba corriendo. **La migración no se ha aplicado en ninguna base.**
- Login real con Google y con correo y contraseña, y comprobar que `updateUser({ password })` funcione sobre una cuenta de Google sin pedir reautenticación. Requiere el proyecto Supabase.
- En Android:
  - Ingreso.
  - Modo avión tras el ingreso.
  - Modo avión con el token vencido (hallazgo 2 del revisor).
- **Riesgo de configuración:** con Email/Password activo y los registros públicos abiertos, alguien podría registrarse con `signUp` usando el correo de un artesano antes que él. Revisar el ajuste de registros de Supabase al configurar el proyecto.

## Siguiente paso
Configurar el proyecto Supabase (URL, clave publicable, Google y Email/Password), aplicar la migración, ejecutar `make test-db` y hacer las pruebas manuales.
