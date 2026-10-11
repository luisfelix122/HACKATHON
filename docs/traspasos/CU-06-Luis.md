# Traspaso CU-06 — Luis

## Rama y alcance

- Rama: `cu-06/confirmacion-pago`, base `main` `465d550` con PRP 005 integrado.
- Responsable del PRP: Cristopher. Ejecución: Luis, por solicitud del usuario.
- CC-16 registra la autorización específica para agregar `MisPedidos.tsx`.
- Producto: únicamente los diez archivos originales del PRP 006 y `MisPedidos.tsx`.
- Documentación: PRP 006, CC-16 y este traspaso. Sin cambios de contratos,
  dependencias, `.env`, núcleo u otros PRP. Sin merge, despliegue o BD compartida.

## Archivos

- `supabase/migrations/0302_transiciones_orden.sql`: nueve RPC restantes.
- `supabase/tests/orden_transiciones.test.sql`: permisos, matriz de estados,
  datos requeridos, repetición, modalidad y recorridos completos envío/recojo.
- `src/pedidos/estadoOrden.ts`, `estadoOrden.test.ts`: acciones por actor/estado,
  etiquetas, carga, enlaces, RPC y comportamiento de componentes.
- `src/pedidos/estimarEntrega.ts`, `estimarEntrega.test.ts`: fecha en Lima,
  plazo, destinos y cambio de mes/año.
- `src/pedidos/acciones.ts`: RPC, contexto de propiedad, errores visibles y
  bloqueo inmediato contra doble clic.
- `src/pedidos/AccionesArtesano.tsx`, `AccionesComprador.tsx`: acciones y formularios.
- `src/pedidos/DetalleOrden.tsx`: integración y reutilización de Realtime CU-05.
- `src/pedidos/MisPedidos.tsx`: conteo en modo artesano.

## Decisiones

- SQL es la autoridad: cada RPC verifica `auth.uid()`, perfil y propiedad antes
  de un `UPDATE` condicionado por estado de origen. Si perdió la carrera,
  devuelve `transicion_invalida`. `search_path` vacío y nombres cualificados;
  sin ejecución de `anon`/`PUBLIC`, ejecución únicamente de `authenticated`.
- Ninguna RPC toca producto o stock. `motivo` opcional conserva la firma del
  contrato; no se inventa almacenamiento adicional para él.
- Total acordado editable; fecha propuesta según Lima/plazo/destino y editable.
  Modalidades de envío y recojo no se pueden intercambiar al despachar.
- Verificar el abono sigue siendo manual y exclusivo del artesano. El comprador
  abre el enlace externo, pero no tiene acción «Ya pagué» que cambie estados.
- Rastreo fijo `https://shalom.com.pe/rastrea`, guía separada, nueva pestaña.
- Conteo derivado de `aceptada`, `confirmada`, `pago_pendiente`, `pagada`;
  aviso desde cinco no bloquea aceptar. No se guarda el conteo en BD.
- Se reutilizan componentes y estilos del módulo; no se introduce otra estética.

## Pruebas y evidencia

Entorno: Node bundled 24.19; Supabase CLI 2.120.0, Postgres aislado existente
`ayllu-cu05-isolated`. Nunca se ejecutaron migraciones o fixtures contra el
endpoint remoto de `.env`.

- RED TS observado antes de implementar: dos módulos ausentes, dos suites
  fallaron; `C:/Users/Luis/AppData/Local/Temp/prp006-ts-red.log`.
- RED SQL observado: RPC ausentes y fallos de existencia/actor/transición;
  `C:/Users/Luis/AppData/Local/Temp/prp006-sql-red.log`.
- GREEN: 134/134 Vitest, 12 archivos (24 pruebas nuevas de CU-06).
  `C:/Users/Luis/AppData/Local/Temp/prp006-ts-all.log`.
- GREEN SQL: 283/283 pgTAP, cinco archivos (183 pruebas CU-06 + 100 anteriores).
  `C:/Users/Luis/AppData/Local/Temp/prp006-sql-green.log`.
- Concurrencia real con dos conexiones locales: primera confirmación commitea;
  segunda espera y recibe `transicion_invalida`; una orden `confirmada`.
  `C:/Users/Luis/AppData/Local/Temp/prp006-concurrency.log`.
  Sus únicos fixtures locales fueron retirados tras comprobar el resultado.
- Lint: cero errores, seis avisos Fast Refresh preexistentes en acceso/admin.
- Formato Prettier check y ambos proyectos TypeScript: pasan.
- Build web y artesano: pasan. No es compilación de APK nativa.
- GNU make no está instalado: se ejecutaron sus comandos reales por separado;
  no se afirma que se ejecutó `make verify` o `make test-db` literalmente.

## Pendientes y siguiente paso

- Revisión independiente del diff y validación nativa de su recibo a cargo
  del orquestador antes de commit/push; no aprobadas por este traspaso.
- Mantener la vista local en `http://127.0.0.1:5173/` sin alterar `.env`.
  La interfaz nueva no demuestra que 0302 esté instalada en la BD compartida.
- Responsable de migraciones: aplicar 0302 únicamente con autorización concreta.
- Prueba humana pendiente: dos cuentas/dispositivos autenticados, llegada por
  Realtime, persistencia tras recarga, pago externo de prueba, entrega completa
  y APK en Android físico. No introducir fixtures en la BD compartida.
- Pago tardío después de cancelar requiere revisión manual, fuera de alcance.
- Una reversión de UI es independiente de migración; no borrar órdenes ni datos.
  Si se deshabilitan RPC, revocar únicamente las nueve firmas 0302 con aprobación
  del responsable; no resetear la BD ni tocar CU-05.
