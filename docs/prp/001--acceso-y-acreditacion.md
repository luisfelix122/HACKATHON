# PRP 001 — Acceso y acreditación RNA

- Caso de uso: CU-01 (`docs/plan.md`)
- Responsable: Cristopher · Revisor: <por asignar> + subagente `reviewer`
- Estado: listo (actualizado por CC-03)
- Rama: `cu-01/acceso-acreditacion`

## Objetivo
- **Comprador:** entra a la web con Google.
- **Artesano:**
  1. En la web, en `/artesano/registro`, crea su cuenta con Google.
  2. Define una contraseña y completa su perfil: WhatsApp, lugar, asociación, historia y número RNA. Su acreditación queda `pendiente`.
  3. En la APK inicia sesión con su correo y su contraseña.
- **Administrador:** en `/admin` ve las solicitudes y las aprueba o rechaza con una nota.

## Por qué
Es el criterio 1 del reto: el vendedor queda acreditado con una validación básica de confianza. Sin acreditación no se publica (regla 1). CC-03 evita el flujo de Google dentro de la APK.

## Criterios de aceptación
- [ ] En la web, «Continuar con Google» crea un `perfil` con `rol = comprador`.
- [ ] En la web, `/artesano/registro`, después de Google, crea un `perfil` con `rol = artesano` y `acreditacion = pendiente`, y pide una contraseña de al menos 8 caracteres con confirmación. La contraseña se guarda con `supabase.auth.updateUser({ password })`.
- [ ] En la APK, la pantalla de ingreso muestra solo correo y contraseña. Con datos válidos entra; con datos inválidos muestra «Correo o contraseña incorrectos», sin revelar cuál de los dos falla.
- [ ] En la APK, si quien entra no tiene `rol = artesano`, se cierra la sesión y aparece «Esta app es para artesanos. Regístrate en <URL web>/artesano/registro».
- [ ] La sesión de la APK persiste al cerrarla y reabrirla, también **en modo avión**: tras el primer login, abre «Mis productos» sin pedir datos.
- [ ] Si olvidó la contraseña, la APK muestra un enlace a la web, donde el artesano entra con Google y define una nueva.
- [ ] Un usuario **no puede** asignarse `rol = admin` ni cambiar su propia `acreditacion`; hay una prueba pgTAP que lo verifica.
- [ ] El artesano no puede enviar su solicitud sin `whatsapp` (E.164), `lugar` (de la lista) y `rna_numero`.
- [ ] El administrador aprueba o rechaza y el cambio se ve en la APK al recargar. Un usuario que no es admin recibe un error al intentarlo.
- [ ] Un visitante anónimo solo lee los campos públicos de los artesanos `aprobada`.

## Contexto necesario
- **Dominio:** Perfil, RNA, Acreditación, Lugar, Asociación; estados de la Acreditación.
- **Contratos:** `docs/contratos.md` §`perfil`, §Acceso, §Permisos (RLS), §Convenciones.
- **Decisiones:** `0001-stack.md`, `CC-01.md`, `CC-03.md`.
- **Código existente a imitar:** `src/compartido/supabase.ts` (PRP 000).
- **Documentación externa:**
  - https://supabase.com/docs/guides/auth/social-login/auth-google: cliente OAuth *Web application*, scopes básicos, `signInWithOAuth`.
  - https://supabase.com/docs/guides/auth/auth-identity-linking: `updateUser({ password })` agrega email y contraseña a una cuenta OAuth.
  - https://supabase.com/docs/reference/javascript/auth-signinwithpassword: solo email o teléfono.
  - https://supabase.com/docs/guides/auth/sessions: la sesión es indefinida por defecto.
- **Trampas conocidas:**
  - **Reautenticación:** `updateUser({ password })` puede exigirla (`nonce`) según la configuración del proyecto (sin verificar). Si la exige, hacer el registro inmediatamente después del login con Google o usar `reauthenticate()`. Si se bloquea, detenerse y avisar.
  - **Proveedor de contraseña:** activar Email/Password en el panel de Supabase. Para no exigir confirmación por correo, el correo de Google ya viene verificado. Comprobar el comportamiento real.
  - **Seguridad de `upsert`:** el trigger `proteger_perfil` impide cambiar `rol` y `acreditacion` salvo a un admin. El rol `artesano` solo se acepta en el insert inicial desde `/artesano/registro`; después ya no se cambia.
  - **Usuarios de prueba:** si la app de Google queda en modo de prueba, registrar las cuentas de la demo como usuarios de prueba.
  - **Crear el admin:** `update perfil set rol = 'admin' where id = '<uuid>'` en el SQL Editor; **no** va en las migraciones.
  - **Contraseñas:** nunca se registran en logs ni en el estado global de la app.

## Archivos (alcance cerrado)
| Acción | Ruta | Responsabilidad |
| --- | --- | --- |
| crear | `supabase/migrations/0001_perfil.sql` | tipos `rol` y `acreditacion`; tabla `perfil`; RLS; trigger `proteger_perfil`; vista `artesano_publico`; función `es_artesano_aprobado(uuid)` |
| crear | `supabase/tests/perfil.test.sql` | pgTAP: autoasignarse admin falla, anónimo solo ve aprobados, admin aprueba |
| crear | `src/compartido/dominio/lugares.ts` | lista preliminar de lugares |
| crear | `src/acceso/sesion.ts` | Google (web), correo y contraseña (APK), cierre de sesión, sesión actual |
| crear | `src/acceso/perfil.ts`, `src/acceso/perfil.test.ts` | leer y hacer `upsert` del perfil; validaciones (E.164, lugar, RNA, contraseña ≥ 8) |
| crear | `src/acceso/PantallaIngresoWeb.tsx` | botón «Continuar con Google» |
| crear | `src/acceso/RegistroArtesano.tsx` | web: Google → contraseña → perfil |
| crear | `src/acceso/IngresoArtesano.tsx` | APK: correo y contraseña, enlace «¿Olvidaste tu contraseña?» |
| crear | `src/acceso/EstadoAcreditacion.tsx` | aviso pendiente / aprobada / rechazada con su nota |
| crear | `src/admin/PanelAcreditacion.tsx` | lista de pendientes; Aprobar y Rechazar |
| modificar | `src/app/AppWeb.tsx`, `src/app/AppArtesano.tsx` | rutas protegidas |

Cualquier archivo fuera de esta tabla requiere aprobación del responsable.

## Tareas (en orden)
1. Escribir la migración y la prueba pgTAP, y aplicarlas.
2. Configurar el proveedor Google y Email/Password. Desde CC-05 se hace en el `.env` y el override de Supabase self-hosted (PRP 010), no en un panel de Supabase Cloud. Es un paso manual de Cristopher; no se commitean valores.
3. `sesion.ts`, `perfil.ts` y sus pruebas.
4. Web: `PantallaIngresoWeb`, `RegistroArtesano` y `PanelAcreditacion`.
5. APK: `IngresoArtesano` y `EstadoAcreditacion`; probar en modo avión tras el login.

## Validación
1. `make verify` y `make test-db`.
2. **Pruebas a crear:**
   - Caso feliz: perfil válido.
   - Error: WhatsApp sin `+51`, lugar inválido, sin RNA, contraseña corta o que no coincide.
   - Borde: autoasignarse admin.
3. **Prueba manual:**
   - Registro en la web desde un celular.
   - Login en la APK.
   - Modo avión y reabrir la app.
   - Aprobación desde `/admin`.

## Fuera de alcance
- Consulta automática del RNA.
- Asociaciones y líderes.
- Preferencias del comprador.
- Recuperación de contraseña por correo (se usa Google en la web).
- Login sin conexión: no es posible; solo se mantiene la sesión.

## Notas / riesgos
- Si `updateUser({ password })` no funciona sobre la cuenta de Google, es bloqueante. Avisar antes de buscar alternativas.
