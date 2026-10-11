# PRP 001 — Acceso y acreditación RNA

- Caso de uso: CU-01 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (actualizado por CC-03, CC-06, CC-08 y CC-09; CC-04 aprobado). Implementación anterior en la etiqueta `respaldo-implementacion`
- Rama: `cu-01/acceso-acreditacion`

## Objetivo
- **Comprador:** entra a la web con Google.
- **Artesano:**
  1. En la APK elige cómo crear su cuenta. El artesano no usa la web (CC-08).
     - **Con correo y contraseña (CC-09):** escribe su correo y una contraseña, sin pasar por Google.
     - **Con Google (CC-06):** Google se abre en el navegador del sistema, vuelve a la app por `pe.ayllu.artesano://auth` y luego define una contraseña.
  2. Completa su perfil: WhatsApp, lugar, asociación, historia y número RNA. Su acreditación queda `pendiente`.
  3. Para volver a entrar usa su correo y su contraseña. Si la olvidó, entra con Google (si su correo es de Google) o pide al administrador que la restablezca. La sesión queda guardada indefinidamente y la app abre sin señal.
- **Administrador:** en `/admin` ve las solicitudes y las aprueba o rechaza con una nota.

## Por qué
Es el criterio 1 del reto: el vendedor queda acreditado con una validación básica de confianza. Sin acreditación no se publica (regla 1).

La **acreditación** es la verificación de que el artesano tiene Registro Nacional del Artesano (RNA) de MINCETUR: da confianza al turista de que compra una pieza auténtica y no reventa industrial. El registro con correo (CC-09) existe porque muchos artesanos no recuerdan su clave de Gmail ni están cómodos con OAuth.

## Criterios de aceptación
- [ ] En la web, «Continuar con Google» crea un `perfil` con `rol = comprador`.
- [ ] En la APK, «Crear cuenta con correo» pide correo y una contraseña de al menos 8 caracteres con confirmación, llama a `supabase.auth.signUp({ email, password })` y, con la sesión ya iniciada (autoconfirmación), muestra el formulario de perfil. Un correo ya registrado muestra «Ese correo ya tiene cuenta. Entra con tu contraseña.» (CC-09).
- [ ] En la APK, después de Google, el formulario pide una contraseña de al menos 8 caracteres con confirmación (`supabase.auth.updateUser({ password })`).
- [ ] Los dos caminos terminan creando un `perfil` con `rol = artesano` y `acreditacion = pendiente`. La web no ofrece registro de artesanos (CC-08).
- [ ] En la APK, la pantalla de ingreso muestra correo y contraseña, y los botones «Entrar con Google» y «Crear cuenta con correo». Con datos válidos entra; con datos inválidos muestra «Correo o contraseña incorrectos», sin revelar cuál de los dos falla.
- [ ] En la APK, una sesión de Google sin perfil muestra el formulario de registro (con «Usar otra cuenta de Google»), nunca «Mis productos».
- [ ] En la APK, si Google se cancela o el intercambio falla, se cierra el navegador y aparece «Google no volvió a la app. Revisa tu conexión y vuelve a intentarlo.» Solo se acepta el deep link exacto `pe.ayllu.artesano://auth`.
- [ ] En la APK, si quien entra no tiene `rol = artesano`, se cierra la sesión y aparece «Esta cuenta es de comprador. Para vender, crea tu cuenta con otro correo de Google.»
- [ ] La sesión de la APK persiste al cerrarla y reabrirla, también **en modo avión**: tras el primer login, abre «Mis productos» sin pedir datos.
- [ ] Si olvidó la contraseña, entra con Google en la APK y la cambia en «Tu cuenta» (CC-08). «¿Olvidaste tu contraseña?» explica las dos salidas: Google o pedir al administrador que la restablezca (CC-09).
- [ ] Un usuario **no puede** asignarse `rol = admin` ni cambiar su propia `acreditacion`; hay una prueba pgTAP que lo verifica.
- [ ] El artesano no puede enviar su solicitud sin `whatsapp` (E.164), `lugar` (de la lista) y `rna_numero`.
- [ ] El administrador aprueba o rechaza y el cambio se ve en la APK al recargar. Un usuario que no es admin recibe un error al intentarlo.
- [ ] Un visitante anónimo solo lee los campos públicos de los artesanos `aprobada`.

## Contexto necesario
- **Dominio:** Perfil, RNA, Acreditación, Lugar, Asociación; estados de la Acreditación.
- **Contratos:** `docs/contratos.md` §`perfil`, §Acceso, §Permisos (RLS), §Convenciones.
- **Decisiones:** `0001-stack.md`, `CC-01.md`, `CC-03.md`, `CC-06.md`, `CC-08.md`, `CC-09.md` (registro con correo).
- **Regla vigente del acceso del artesano** (resuelve la contradicción entre CC-03 y CC-06 que señaló Luis en CC-10): manda la suma de CC-06, CC-08 y CC-09. Todo ocurre en la APK; la cuenta se crea con correo y contraseña o con Google por deep link; el ingreso posterior siempre es con correo y contraseña. De CC-03 solo sigue vigente el ingreso con correo y contraseña; su registro en la web quedó eliminado.
- **Código existente a imitar:** `src/compartido/supabase.ts` (PRP 000).
- **Documentación externa:**
  - https://supabase.com/docs/guides/auth/social-login/auth-google: cliente OAuth *Web application*, scopes básicos, `signInWithOAuth`.
  - https://supabase.com/docs/guides/auth/auth-identity-linking: `updateUser({ password })` agrega email y contraseña a una cuenta OAuth.
  - https://supabase.com/docs/reference/javascript/auth-signinwithpassword: solo email o teléfono.
  - https://supabase.com/docs/reference/javascript/auth-signup: con autoconfirmación, `signUp` devuelve la sesión directamente.
  - https://supabase.com/docs/guides/auth/sessions: la sesión es indefinida por defecto.
- **Trampas conocidas:**
  - **Reautenticación:** `updateUser({ password })` puede exigirla (`nonce`) según la configuración del proyecto (sin verificar). Si la exige, hacer el registro inmediatamente después del login con Google o usar `reauthenticate()`. Si se bloquea, detenerse y avisar.
  - **Proveedor de contraseña:** Email/Password activo con `ENABLE_EMAIL_SIGNUP=true` y `ENABLE_EMAIL_AUTOCONFIRM=true` en el Supabase self-hosted (PRP 010), porque no hay SMTP. Comprobar que `signUp` devuelve la sesión.
  - **Correo de otra persona (riesgo aceptado, CC-09):** sin confirmación, alguien podría registrarse con un correo ajeno. Publicar sigue exigiendo la aprobación del administrador. No intentar mitigarlo en este PRP.
  - **Seguridad de `upsert`:** el trigger `proteger_perfil` impide cambiar `rol` y `acreditacion` salvo a un admin. El rol `artesano` solo se acepta en el insert inicial desde el registro de la APK; después ya no se cambia.
  - **Usuarios de prueba:** si la app de Google queda en modo de prueba, registrar las cuentas de la demo como usuarios de prueba.
  - **Crear el admin:** `update perfil set rol = 'admin' where id = '<uuid>'` en el SQL Editor; **no** va en las migraciones.
  - **Contraseñas:** nunca se registran en logs ni en el estado global de la app.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0001_perfil.sql` | tipos `rol` y `acreditacion`; tabla `perfil`; RLS; trigger `proteger_perfil`; vista `artesano_publico`; función `es_artesano_aprobado(uuid)` |
| crear | `supabase/tests/perfil.test.sql` | pgTAP: autoasignarse admin falla, anónimo solo ve aprobados, admin aprueba |
| crear | `src/compartido/dominio/lugares.ts` | lista preliminar de lugares |
| crear | `src/acceso/sesion.ts` | Google (web), registro con correo y contraseña e ingreso (APK), cierre de sesión, sesión actual |
| crear | `src/acceso/perfil.ts`, `src/acceso/perfil.test.ts` | leer y hacer `upsert` del perfil; validaciones (E.164, lugar, RNA, contraseña ≥ 8) |
| modificar | `src/compartido/supabase.ts` | clave fija de la sesión (`ayllu.auth`) para leerla sin conexión (CC-04) |
| crear | `src/acceso/googleApk.ts`, `src/acceso/googleApk.test.ts` | registro con Google en la APK (CC-06): abrir el navegador del sistema, leer el deep link exacto y canjear el código PKCE |
| modificar | `android/app/src/main/AndroidManifest.xml` | `intent-filter` del scheme `pe.ayllu.artesano`, host `auth` (CC-06) |
| modificar | `src/main.tsx` | carga cada app con import dinámico por modo, para que la web no incluya Capacitor |
| crear | `src/acceso/sesion.test.ts` | ingreso de la APK: artesano, credenciales inválidas, rol incorrecto, registro incompleto; registro con correo: éxito y correo ya registrado |
| crear | `src/acceso/usePerfil.ts` | perfil de la sesión con copia local, para abrir la APK sin conexión |
| crear | `src/acceso/PantallaIngresoWeb.tsx` | botón «Continuar con Google» |
| crear | `src/acceso/RegistroArtesano.tsx` | APK: registro con correo y contraseña (CC-09) o tras Google, perfil y cambio de contraseña (CC-08) |
| crear | `src/acceso/IngresoArtesano.tsx` | APK: correo y contraseña, enlace «¿Olvidaste tu contraseña?» |
| crear | `src/acceso/EstadoAcreditacion.tsx` | aviso pendiente / aprobada / rechazada con su nota |
| crear | `src/admin/PanelAcreditacion.tsx` | lista de pendientes; Aprobar y Rechazar |
| modificar | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx`, `src/app/app.test.tsx` | rutas protegidas; pruebas con Supabase simulado |
| modificar | `src/compartido/ui/estilos.css` | formularios, avisos y tarjetas |
| modificar | `docs/contratos.md`, `README.md` | §Acceso (CC-08); se elimina `VITE_WEB_URL` |
| modificar | `src/test/setup.ts` | limpieza del DOM entre pruebas |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Escribir la migración y la prueba pgTAP, y aplicarlas.
2. Configurar el proveedor Google y Email/Password. Desde CC-05 se hace en el `.env` y el override de Supabase self-hosted (PRP 010), no en un panel de Supabase Cloud. Es un paso manual de Cristopher; no se commitean valores.
3. `sesion.ts`, `perfil.ts` y sus pruebas.
4. Web: `PantallaIngresoWeb` y `PanelAcreditacion`. APK: registro con correo, registro tras Google y «Tu cuenta» (CC-08, CC-09).
5. APK: `IngresoArtesano` y `EstadoAcreditacion`; probar en modo avión tras el login.

## Validación
1. `make verify` y `make test-db`.
2. **Pruebas a crear:**
   - Caso feliz: perfil válido.
   - Error: WhatsApp sin `+51`, lugar inválido, sin RNA, contraseña corta o que no coincide.
   - Borde: autoasignarse admin.
3. **Prueba manual:**
   - Registro desde la APK con correo y contraseña, y otro con Google, en un Android real.
   - Login en la APK.
   - Modo avión y reabrir la app.
   - Aprobación desde `/admin`.

## Fuera de alcance
- Consulta automática del RNA.
- Asociaciones y líderes.
- Preferencias del comprador.
- Recuperación de contraseña por correo (no hay SMTP; se usa Google o el administrador, CC-09).
- Confirmación del correo en el registro (para producción, con SMTP).
- Login sin conexión: no es posible; solo se mantiene la sesión.

## Notas / riesgos
- Si `updateUser({ password })` no funciona sobre la cuenta de Google, es bloqueante. Avisar antes de buscar alternativas.
