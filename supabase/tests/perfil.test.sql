-- PRP 012 · perfil: tipos, RLS, trigger proteger_perfil, vista artesano_publico
-- y función es_artesano_aprobado (docs/contratos.md §perfil, §Permisos).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

-- ---------------------------------------------------------------------------
-- Estructura
-- ---------------------------------------------------------------------------
select has_table('public', 'perfil', 'existe la tabla perfil');
select enum_has_labels('public', 'rol', array['comprador', 'artesano', 'admin'], 'tipo rol');
select enum_has_labels('public', 'acreditacion', array['pendiente', 'aprobada', 'rechazada'], 'tipo acreditacion');
select ok((select relrowsecurity from pg_class where oid = 'public.perfil'::regclass), 'perfil tiene RLS');
select hasnt_column('public', 'artesano_publico', 'rna_numero', 'la vista pública no expone el RNA');

-- ---------------------------------------------------------------------------
-- Datos de la prueba (como postgres; no dependen de seed.sql)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role) values
  ('a0000000-0000-0000-0000-00000000000a', 'pendiente@prueba.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000b', 'aprobada@prueba.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000c', 'rechazada@prueba.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000d', 'comprador@prueba.test', 'authenticated', 'authenticated'),
  ('a0000000-0000-0000-0000-00000000000e', 'nuevo@prueba.test', 'authenticated', 'authenticated');

insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion, acreditacion_nota) values
  ('a0000000-0000-0000-0000-00000000000a', 'artesano', 'Pendiente', '+51911111111', 'Lobitos', 'RNA-P', 'pendiente', null),
  ('a0000000-0000-0000-0000-00000000000b', 'artesano', 'Aprobada', '+51922222222', 'Máncora', 'RNA-A', 'aprobada', null),
  ('a0000000-0000-0000-0000-00000000000c', 'artesano', 'Rechazada', '+51933333333', 'Colán', 'RNA-R', 'rechazada', 'No se pudo verificar');

select is(public.es_artesano_aprobado('a0000000-0000-0000-0000-00000000000b'), true, 'es_artesano_aprobado: aprobada');
select is(public.es_artesano_aprobado('a0000000-0000-0000-0000-00000000000a'), false, 'es_artesano_aprobado: pendiente');

select throws_ok(
  $$insert into public.perfil (id, rol, nombre, lugar, rna_numero) values
    ('a0000000-0000-0000-0000-00000000000e', 'artesano', 'Sin WhatsApp', 'Lobitos', 'RNA-X')$$,
  '23514', null, 'un artesano necesita WhatsApp, lugar y RNA');
select throws_ok(
  $$insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero) values
    ('a0000000-0000-0000-0000-00000000000e', 'artesano', 'Lugar raro', '+51944444444', 'Lima', 'RNA-X')$$,
  '23514', null, 'el lugar sale de la lista del contrato');

-- ---------------------------------------------------------------------------
-- Alta del perfil propio (comprador en la web, artesano en la APK)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000d","role":"authenticated"}', true);

select throws_ok(
  $$insert into public.perfil (id, rol, nombre) values ('a0000000-0000-0000-0000-00000000000d', 'admin', 'Yo')$$,
  '42501', null, 'nadie se da de alta como admin');
select lives_ok(
  $$insert into public.perfil (id, rol, nombre) values ('a0000000-0000-0000-0000-00000000000d', 'comprador', 'Comprador')$$,
  'el comprador crea su propio perfil');
select is((select acreditacion from public.perfil where id = 'a0000000-0000-0000-0000-00000000000d'), null,
  'un comprador no tiene acreditación');

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000e","role":"authenticated"}', true);
select throws_ok(
  $$insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion) values
    ('a0000000-0000-0000-0000-00000000000e', 'artesano', 'Atajo', '+51955555555', 'Lobitos', 'RNA-E', 'aprobada')$$,
  '42501', null, 'un artesano no se da de alta ya aprobado');
select lives_ok(
  $$insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero) values
    ('a0000000-0000-0000-0000-00000000000e', 'artesano', 'Nuevo', '+51955555555', 'Lobitos', 'RNA-E')$$,
  'un artesano se da de alta sin indicar acreditación');
select is((select acreditacion::text from public.perfil where id = 'a0000000-0000-0000-0000-00000000000e'), 'pendiente',
  'la acreditación de un artesano nuevo es pendiente');

-- ---------------------------------------------------------------------------
-- proteger_perfil: rol, acreditación y nota no los cambia el propio usuario
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000a","role":"authenticated"}', true);
select throws_ok($$update public.perfil set rol = 'admin' where id = 'a0000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no cambia su rol');
select throws_ok($$update public.perfil set acreditacion = 'aprobada' where id = 'a0000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no cambia su acreditación');
select throws_ok($$update public.perfil set acreditacion_nota = 'ok' where id = 'a0000000-0000-0000-0000-00000000000a'$$,
  'P0001', null, 'no escribe la nota de acreditación');
select lives_ok($$update public.perfil set nombre = 'Pendiente editado' where id = 'a0000000-0000-0000-0000-00000000000a'$$,
  'edita sus datos');
select is((select count(*)::int from public.perfil), 1, 'solo lee su propio perfil');

-- Intento de editar un perfil ajeno: RLS lo filtra y no cambia nada.
update public.perfil set nombre = 'Hackeado' where id = 'a0000000-0000-0000-0000-00000000000b';

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-00000000000c","role":"authenticated"}', true);
update public.perfil set rna_numero = 'RNA-R2' where id = 'a0000000-0000-0000-0000-00000000000c';

-- ---------------------------------------------------------------------------
-- Visitante: solo los campos públicos de artesanos aprobados
-- ---------------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is((select count(*)::int from public.perfil), 0, 'el visitante no lee la tabla perfil');
select results_eq(
  $$select nombre from public.artesano_publico where id in (
      'a0000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-00000000000c')$$,
  array['Aprobada'], 'artesano_publico solo muestra artesanos aprobados');

reset role;
select is((select nombre from public.perfil where id = 'a0000000-0000-0000-0000-00000000000b'), 'Aprobada',
  'nadie edita un perfil ajeno');
select is((select acreditacion::text from public.perfil where id = 'a0000000-0000-0000-0000-00000000000c'), 'pendiente',
  'corregir el RNA devuelve la acreditación a pendiente (docs/dominio.md)');

select * from finish();
rollback;
