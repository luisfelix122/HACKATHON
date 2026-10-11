-- CU-03 · Pruebas pgTAP para transiciones de estado del producto y revisión IA.
begin;
select plan(8);

-- 1. Setup usuario y perfil de artesana aprobada
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'artesana_ia@prueba.test');

insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion) values
  ('00000000-0000-0000-0000-0000000000c1', 'artesano', 'Elena', '+51933333333', 'Máncora', 'RNA-E1', 'aprobada');

-- Insertar producto base en borrador
insert into public.producto (id, artesano_id, estado, nombre, precio_final, ficha, revision_ia, disponibilidad)
values (
  '20000000-0000-0000-0000-0000000000c1',
  '00000000-0000-0000-0000-0000000000c1',
  'borrador',
  'Collar marino',
  45.00,
  '{"titulo":"Collar marino","descripcion":"Conchas de mar","materiales":["conchas"],"tecnica":"engarzado","tipo_producto":"bisutería marina","historia_pieza":"","etiquetas":["collar","playa"]}'::jsonb,
  'sin_revisar', 'en_stock'
);

insert into public.foto_producto (id, producto_id, origen, ruta, publicada, posicion)
values (
  '30000000-0000-0000-0000-0000000000c1',
  '20000000-0000-0000-0000-0000000000c1',
  'original',
  '00000000-0000-0000-0000-0000000000c1/20000000-0000-0000-0000-0000000000c1/original.jpg',
  true,
  0
);

-- Transición válida 1: borrador -> procesando
select lives_ok(
  $$ update public.producto set estado = 'procesando' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'transicion valida: borrador a procesando'
);

-- Transición inválida 1: procesando -> publicado (no puede saltar sin revision)
select throws_ok(
  $$ update public.producto set estado = 'publicado' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'P0001', null,
  'transicion invalida: procesando a publicado no esta permitida'
);

-- Transición válida 2: procesando -> en_revision
select lives_ok(
  $$ update public.producto set estado = 'en_revision' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'transicion valida: procesando a en_revision'
);

-- Transición válida 3: en_revision -> publicado
select lives_ok(
  $$ update public.producto set estado = 'publicado' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'transicion valida: en_revision a publicado'
);

-- Transición inválida 2: publicado -> borrador
select throws_ok(
  $$ update public.producto set estado = 'borrador' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'P0001', null,
  'transicion invalida: publicado a borrador no esta permitida directamente'
);

-- Transición válida 4: publicado -> retirado
select lives_ok(
  $$ update public.producto set estado = 'retirado' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'transicion valida: publicado a retirado'
);

-- Transición inválida 3: retirado -> procesando
select throws_ok(
  $$ update public.producto set estado = 'procesando' where id = '20000000-0000-0000-0000-0000000000c1' $$,
  'P0001', null,
  'transicion invalida: retirado a procesando no esta permitida'
);

-- Producto con revision_ia rechazada no puede publicarse
insert into public.producto (id, artesano_id, estado, nombre, precio_final, ficha, revision_ia, disponibilidad)
values (
  '20000000-0000-0000-0000-0000000000c2',
  '00000000-0000-0000-0000-0000000000c1',
  'en_revision',
  'Vaso plástico',
  10.00,
  '{"titulo":"Vaso","descripcion":"Vaso comercial","materiales":["plastico"],"tecnica":"industrial","tipo_producto":"utilitario","historia_pieza":"","etiquetas":["vaso"]}'::jsonb,
  'rechazada', 'en_stock'
);

insert into public.foto_producto (id, producto_id, origen, ruta, publicada, posicion)
values (
  '30000000-0000-0000-0000-0000000000c2',
  '20000000-0000-0000-0000-0000000000c2',
  'original',
  '00000000-0000-0000-0000-0000000000c1/20000000-0000-0000-0000-0000000000c2/original.jpg',
  true,
  0
);

select throws_ok(
  $$ update public.producto set estado = 'publicado' where id = '20000000-0000-0000-0000-0000000000c2' $$,
  'P0001', null,
  'publicar con revision_ia = rechazada falla siempre'
);

select * from finish();
rollback;
