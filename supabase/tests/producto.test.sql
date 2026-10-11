-- PRP 012 · producto y foto_producto: tipos, restricciones, RLS, triggers
-- proteger_producto y exigir_acreditacion_para_publicar, y buckets
-- (docs/contratos.md §producto, §Ficha, §foto_producto, §Archivos, §Permisos).
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

-- ---------------------------------------------------------------------------
-- Estructura
-- ---------------------------------------------------------------------------
select has_table('public', 'producto', 'existe la tabla producto');
select has_table('public', 'foto_producto', 'existe la tabla foto_producto');
select enum_has_labels('public', 'estado_producto',
  array['borrador', 'procesando', 'en_revision', 'publicado', 'retirado'], 'tipo estado_producto');
select enum_has_labels('public', 'disponibilidad', array['en_stock', 'a_pedido'], 'tipo disponibilidad');
select enum_has_labels('public', 'revision_ia', array['sin_revisar', 'aprobada', 'rechazada'], 'tipo revision_ia');
select enum_has_labels('public', 'origen_foto', array['original', 'ia'], 'tipo origen_foto');
select enum_has_labels('public', 'variante_foto', array['estudio', 'luz', 'vitrina', 'contexto'], 'tipo variante_foto');
select results_eq($$select id, public from storage.buckets where id in ('audios', 'fotos') order by id$$,
  $$values ('audios'::text, false), ('fotos'::text, true)$$, 'bucket fotos público y audios privado');

-- ---------------------------------------------------------------------------
-- Datos de la prueba
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('b0000000-0000-0000-0000-00000000000a', 'duena@prueba.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-00000000000b', 'otra@prueba.test', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-00000000000c', 'pendiente@prueba.test', 'authenticated', 'authenticated');
insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion) values
  ('b0000000-0000-0000-0000-00000000000a', 'artesano', 'Dueña', '+51911111111', 'Lobitos', 'RNA-1', 'aprobada'),
  ('b0000000-0000-0000-0000-00000000000b', 'artesano', 'Otra', '+51922222222', 'Colán', 'RNA-2', 'aprobada'),
  ('b0000000-0000-0000-0000-00000000000c', 'artesano', 'Pendiente', '+51933333333', 'Máncora', 'RNA-3', 'pendiente');

-- Producto de la artesana pendiente, listo salvo por su acreditación.
insert into public.producto (id, artesano_id, estado, nombre, ficha, precio_final, disponibilidad, revision_ia) values
  ('b1000000-0000-0000-0000-00000000000c', 'b0000000-0000-0000-0000-00000000000c', 'en_revision', 'Pieza pendiente',
   '{"titulo":"Pieza","descripcion":"Hecha a mano.","materiales":["algodón"],"tecnica":"crochet","tipo_producto":"textil","historia_pieza":"","etiquetas":[]}',
   20, 'en_stock', 'aprobada');
insert into public.foto_producto (id, producto_id, origen, ruta, posicion) values
  ('b2000000-0000-0000-0000-00000000000c', 'b1000000-0000-0000-0000-00000000000c', 'original',
   'b0000000-0000-0000-0000-00000000000c/b1000000-0000-0000-0000-00000000000c/original.jpg', 0);

-- Restricciones del contrato (como postgres)
select throws_ok($$insert into public.producto (artesano_id, nombre, precio_final) values
  ('b0000000-0000-0000-0000-00000000000a', 'Gratis', 0)$$, '23514', null, 'precio_final debe ser mayor que 0');
select throws_ok($$insert into public.producto (artesano_id, nombre, disponibilidad) values
  ('b0000000-0000-0000-0000-00000000000a', 'Sin plazo', 'a_pedido')$$, '23514', null, 'a_pedido exige plazo_dias');
select throws_ok($$insert into public.producto (artesano_id, nombre, ficha) values
  ('b0000000-0000-0000-0000-00000000000a', 'Ficha rara',
   '{"titulo":"T","descripcion":"D","materiales":["m"],"tecnica":"t","tipo_producto":"cerámica","historia_pieza":"","etiquetas":[]}')$$,
  '23514', null, 'tipo_producto sale de la lista del dominio');
select throws_ok($$insert into public.producto (artesano_id, nombre, ficha) values
  ('b0000000-0000-0000-0000-00000000000a', 'Etiqueta rara',
   '{"titulo":"T","descripcion":"D","materiales":["m"],"tecnica":"t","tipo_producto":"textil","historia_pieza":"","etiquetas":["Crochet"]}')$$,
  '23514', null, 'las etiquetas van en minúsculas');
select throws_ok($$insert into public.foto_producto (producto_id, origen, ruta, posicion) values
  ('b1000000-0000-0000-0000-00000000000c', 'ia', 'x/y/ia.png', 1)$$, '23514', null, 'una foto de IA necesita variante');
select throws_ok($$insert into public.foto_producto (producto_id, origen, ruta, posicion) values
  ('b1000000-0000-0000-0000-00000000000c', 'original',
   'b0000000-0000-0000-0000-00000000000c/b1000000-0000-0000-0000-00000000000c/original.jpg', 1)$$,
  '23505', null, 'solo una foto original por producto');

-- ---------------------------------------------------------------------------
-- La artesana dueña
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);

select lives_ok($$insert into public.producto (id, artesano_id, estado, nombre, descripcion_texto) values
  ('b1000000-0000-0000-0000-00000000000a', 'b0000000-0000-0000-0000-00000000000a', 'borrador', 'Mi pieza', 'Tejida a mano')$$,
  'crea su borrador con el id del cliente');
select throws_ok($$insert into public.foto_producto (producto_id, origen, ruta) values
  ('b1000000-0000-0000-0000-00000000000a', 'original',
   'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/otra.jpg')$$,
  'P0001', null, 'la original usa la ruta canónica protegida en Storage');
select throws_ok($$insert into public.producto (artesano_id, estado, nombre) values
  ('b0000000-0000-0000-0000-00000000000a', 'publicado', 'Atajo')$$, '42501', null, 'no crea un producto ya publicado');
select throws_ok($$insert into public.producto (artesano_id, nombre) values
  ('b0000000-0000-0000-0000-00000000000b', 'Ajeno')$$, '42501', null, 'no crea productos a nombre de otra');
select throws_ok($$update public.producto set revision_ia = 'aprobada' where id = 'b1000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no escribe revision_ia');
select throws_ok($$update public.producto set ia_intentos = 5 where id = 'b1000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no escribe ia_intentos');
select throws_ok($$update public.producto set comentario_precio_ia = 'barato' where id = 'b1000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no escribe comentario_precio_ia');

select lives_ok($$insert into public.foto_producto (id, producto_id, origen, ruta, posicion) values
  ('b2000000-0000-0000-0000-00000000000a', 'b1000000-0000-0000-0000-00000000000a', 'original',
   'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg', 0)$$,
  'sube la fila de su foto original');
select is((select publicada from public.foto_producto where id = 'b2000000-0000-0000-0000-00000000000a'), true,
  'la original nace publicada');
select throws_ok($$update public.foto_producto set ruta = 'otra.jpg' where id = 'b2000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'la foto original no se sobrescribe');

-- Publicar: sin foto publicada, con revisión rechazada y sin acreditación, falla.
update public.producto set
  ficha = '{"titulo":"Mi pieza","descripcion":"Tejida a mano.","materiales":["algodón"],"tecnica":"crochet","tipo_producto":"textil","historia_pieza":"","etiquetas":["crochet"]}',
  precio_final = 50, disponibilidad = 'en_stock', estado = 'en_revision'
where id = 'b1000000-0000-0000-0000-00000000000a';
update public.foto_producto set publicada = false where id = 'b2000000-0000-0000-0000-00000000000a';
select throws_ok($$update public.producto set estado = 'publicado' where id = 'b1000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no publica sin una foto publicada');
update public.foto_producto set publicada = true where id = 'b2000000-0000-0000-0000-00000000000a';

reset role;
select set_config('request.jwt.claims', '', true);
update public.producto set revision_ia = 'rechazada' where id = 'b1000000-0000-0000-0000-00000000000a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$update public.producto set estado = 'publicado' where id = 'b1000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no publica con revision_ia rechazada');

reset role;
select set_config('request.jwt.claims', '', true);
update public.producto set revision_ia = 'aprobada' where id = 'b1000000-0000-0000-0000-00000000000a';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select lives_ok($$update public.producto set estado = 'publicado' where id = 'b1000000-0000-0000-0000-00000000000a'$$,
  'publica con acreditación aprobada, revisión aprobada y una foto publicada');

-- Borrar fotos: la original no (RLS la filtra), una de IA sí.
reset role;
select set_config('request.jwt.claims', '', true);
insert into public.foto_producto (id, producto_id, origen, variante, ruta, posicion) values
  ('b2000000-0000-0000-0000-0000000000a1', 'b1000000-0000-0000-0000-00000000000a', 'ia', 'estudio', 'x/y/ia-estudio.png', 1),
  ('b2000000-0000-0000-0000-0000000000a2', 'b1000000-0000-0000-0000-00000000000a', 'ia', 'luz', 'x/y/ia-luz.png', 2);
select is((select publicada from public.foto_producto where id = 'b2000000-0000-0000-0000-0000000000a1'), false,
  'una foto de IA nace sin publicar');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
delete from public.foto_producto where id = 'b2000000-0000-0000-0000-00000000000a';
delete from public.foto_producto where id = 'b2000000-0000-0000-0000-0000000000a1';

-- ---------------------------------------------------------------------------
-- La artesana pendiente no publica
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
select throws_ok($$update public.producto set estado = 'publicado' where id = 'b1000000-0000-0000-0000-00000000000c'$$,
  'P0001', null, 'no publica sin acreditación aprobada');

-- ---------------------------------------------------------------------------
-- Otra artesana no toca productos ajenos
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000b","role":"authenticated"}', true);
update public.producto set nombre = 'Hackeado' where id = 'b1000000-0000-0000-0000-00000000000a';
select is((select count(*)::int from public.producto where id = 'b1000000-0000-0000-0000-00000000000c'), 0,
  'no lee borradores ni productos en revisión ajenos');

-- ---------------------------------------------------------------------------
-- Visitante
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select results_eq($$select nombre from public.producto where artesano_id::text like 'b0000000%'$$,
  array['Mi pieza'], 'el visitante solo ve productos publicados');
select results_eq($$select origen::text from public.foto_producto where producto_id = 'b1000000-0000-0000-0000-00000000000a'$$,
  array['original'], 'el visitante ve la original y no la foto de IA sin publicar');

reset role;
select is((select nombre from public.producto where id = 'b1000000-0000-0000-0000-00000000000a'), 'Mi pieza',
  'nadie edita un producto ajeno');
select results_eq($$select origen::text || '-' || coalesce(variante::text, '') from public.foto_producto where producto_id = 'b1000000-0000-0000-0000-00000000000a' order by posicion$$,
  array['original-', 'ia-luz'], 'la original no se borra; la foto de IA borrada desaparece');

-- Regresiones: un producto publicado conserva al menos una foto elegida.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$update public.foto_producto set publicada = false where id = 'b2000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no desmarca la última foto de un producto publicado');
update public.foto_producto set publicada = true where id = 'b2000000-0000-0000-0000-0000000000a2';
update public.foto_producto set publicada = false where id = 'b2000000-0000-0000-0000-00000000000a';
select throws_ok($$delete from public.foto_producto where id = 'b2000000-0000-0000-0000-0000000000a2'$$,
  'P0001', null, 'no borra la última foto elegida aunque sea de IA');

-- Storage: probar los permisos sobre objetos, no solo sobre los buckets.
insert into storage.objects (bucket_id, name) values
  ('fotos', 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg');
update storage.objects set metadata = '{"alterada":true}' where bucket_id = 'fotos'
  and name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg';
reset role;
select is((select metadata from storage.objects where bucket_id = 'fotos'
  and name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg'),
  null::jsonb, 'Storage no permite sobrescribir la original');
set local role authenticated;
update storage.objects set name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/renombrada.jpg'
  where bucket_id = 'fotos' and name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg';
reset role;
select is((select count(*)::int from storage.objects where bucket_id = 'fotos'
  and name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg'),
  1, 'Storage no permite renombrar la original');
set local role authenticated;
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id = 'fotos'
  and name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg';
reset role;
select is((select count(*)::int from storage.objects where bucket_id = 'fotos'
  and name = 'b0000000-0000-0000-0000-00000000000a/b1000000-0000-0000-0000-00000000000a/original.jpg'),
  1, 'Storage no permite borrar la original');

select * from finish();
rollback;
