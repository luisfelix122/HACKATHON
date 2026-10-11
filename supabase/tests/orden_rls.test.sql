-- PRP 012 · orden y mensaje_orden: tipos, restricciones, RLS por unión con
-- producto y publicación Realtime (docs/contratos.md §orden, §mensaje_orden,
-- §Permisos, §Transiciones de orden).
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- ---------------------------------------------------------------------------
-- Estructura
-- ---------------------------------------------------------------------------
select has_table('public', 'orden', 'existe la tabla orden');
select has_table('public', 'mensaje_orden', 'existe la tabla mensaje_orden');
select enum_has_labels('public', 'modalidad', array['recojo', 'envio'], 'tipo modalidad');
select enum_has_labels('public', 'estado_orden',
  array['solicitada', 'aceptada', 'rechazada', 'confirmada', 'pago_pendiente', 'pagada', 'enviada',
        'lista_para_recojo', 'entregada', 'cancelada'], 'tipo estado_orden');
select is_empty($$select 1 from pg_policies where schemaname = 'public' and tablename = 'orden'
  and cmd in ('UPDATE', 'INSERT', 'DELETE', 'ALL')$$, 'orden no tiene políticas de escritura: solo cambia por RPC');
select is(
  (select array_agg(tablename::text order by tablename::text) from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename in ('orden', 'mensaje_orden')),
  array['mensaje_orden', 'orden'], 'orden y mensaje_orden están en supabase_realtime');

-- ---------------------------------------------------------------------------
-- Datos de la prueba
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('c0000000-0000-0000-0000-00000000000a', 'artesana@prueba.test', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-00000000000b', 'otra@prueba.test', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-0000000000c1', 'compra1@prueba.test', 'authenticated', 'authenticated'),
  ('c0000000-0000-0000-0000-0000000000c2', 'compra2@prueba.test', 'authenticated', 'authenticated');
insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion) values
  ('c0000000-0000-0000-0000-00000000000a', 'artesano', 'Artesana', '+51911111111', 'Lobitos', 'RNA-1', 'aprobada'),
  ('c0000000-0000-0000-0000-00000000000b', 'artesano', 'Otra', '+51922222222', 'Colán', 'RNA-2', 'aprobada');
insert into public.perfil (id, rol, nombre) values
  ('c0000000-0000-0000-0000-0000000000c1', 'comprador', 'Compra Uno'),
  ('c0000000-0000-0000-0000-0000000000c2', 'comprador', 'Compra Dos');
insert into public.producto (id, artesano_id, estado, nombre, ficha, precio_final, disponibilidad, revision_ia) values
  ('c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'publicado', 'Pieza',
   '{"titulo":"Pieza","descripcion":"Hecha a mano.","materiales":["algodón"],"tecnica":"crochet","tipo_producto":"textil","historia_pieza":"","etiquetas":[]}',
   40, 'en_stock', 'aprobada');
insert into public.orden (id, producto_id, comprador_id, cantidad, modalidad) values
  ('c2000000-0000-0000-0000-00000000000a', 'c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', 1, 'recojo');
insert into public.mensaje_orden (orden_id, autor_id, texto_original) values
  ('c2000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', 'Hola');

-- Restricciones del contrato (como postgres)
select throws_ok($$insert into public.orden (producto_id, comprador_id, cantidad, modalidad) values
  ('c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', 0, 'recojo')$$,
  '23514', null, 'la cantidad es al menos 1');
select throws_ok($$insert into public.orden (producto_id, comprador_id, cantidad, modalidad) values
  ('c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', 1, 'envio')$$,
  '23514', null, 'un envío necesita datos_envio');
select throws_ok($$insert into public.orden (producto_id, comprador_id, cantidad, modalidad, estado) values
  ('c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', 1, 'recojo', 'aceptada')$$,
  '23514', null, 'una orden aceptada tiene total y fecha estimada');
select throws_ok($$insert into public.mensaje_orden (orden_id, autor_id, texto_original) values
  ('c2000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', '')$$,
  '23514', null, 'un mensaje no está vacío');

-- ---------------------------------------------------------------------------
-- Comprador de la orden
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
select is((select count(*)::int from public.orden), 1, 'el comprador ve su orden');
select is((select count(*)::int from public.mensaje_orden), 1, 'el comprador ve los mensajes de su orden');
select throws_ok($$insert into public.orden (producto_id, comprador_id, cantidad, modalidad) values
  ('c1000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', 1, 'recojo')$$,
  '42501', null, 'no crea órdenes directamente: se crean por RPC');
select lives_ok($$insert into public.mensaje_orden (orden_id, autor_id, texto_original) values
  ('c2000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c1', '¿Llega el viernes?')$$,
  'escribe en el hilo de su orden');
select throws_ok($$insert into public.mensaje_orden (orden_id, autor_id, texto_original) values
  ('c2000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'Suplantación')$$,
  '42501', null, 'no escribe en nombre de otra persona');
update public.orden set estado = 'pagada' where id = 'c2000000-0000-0000-0000-00000000000a';

-- ---------------------------------------------------------------------------
-- Artesana del producto (se obtiene de producto.artesano_id)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select is((select count(*)::int from public.orden), 1, 'la artesana ve la orden de su producto');
select lives_ok($$insert into public.mensaje_orden (orden_id, autor_id, texto_original) values
  ('c2000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-00000000000a', 'Sí, el viernes')$$,
  'la artesana escribe en el hilo');

-- ---------------------------------------------------------------------------
-- Terceros
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
select is((select count(*)::int from public.orden), 0, 'otro comprador no ve órdenes ajenas');
select is((select count(*)::int from public.mensaje_orden), 0, 'otro comprador no lee mensajes ajenos');
select throws_ok($$insert into public.mensaje_orden (orden_id, autor_id, texto_original) values
  ('c2000000-0000-0000-0000-00000000000a', 'c0000000-0000-0000-0000-0000000000c2', 'Hola')$$,
  '42501', null, 'no escribe en una orden ajena');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
select is((select count(*)::int from public.orden), 0, 'otra artesana no ve órdenes de productos ajenos');

reset role;
select is((select estado::text from public.orden where id = 'c2000000-0000-0000-0000-00000000000a'), 'solicitada',
  'nadie cambia el estado de una orden directamente');

select * from finish();
rollback;
