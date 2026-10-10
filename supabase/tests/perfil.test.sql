-- CU-01 · Pruebas pgTAP de perfil. Ejecutar con `make test-db`.
begin;
select plan(15);

-- Usuarios de prueba.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin@prueba.test'),
  ('00000000-0000-0000-0000-0000000000b1', 'artesana@prueba.test'),
  ('00000000-0000-0000-0000-0000000000b2', 'artesano2@prueba.test'),
  ('00000000-0000-0000-0000-0000000000c1', 'comprador@prueba.test');

-- El admin se crea sin sesión (como en el SQL Editor).
insert into public.perfil (id, rol, nombre)
values ('00000000-0000-0000-0000-0000000000a1', 'admin', 'Admin');

-- Como comprador ----------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.perfil (id, rol, nombre)
     values ('00000000-0000-0000-0000-0000000000c1', 'admin', 'Intruso') $$,
  '42501', null,
  'nadie se da de alta como admin'
);

select lives_ok(
  $$ insert into public.perfil (id, rol, nombre)
     values ('00000000-0000-0000-0000-0000000000c1', 'comprador', 'Comprador') $$,
  'un comprador crea su propio perfil'
);

select throws_ok(
  $$ update public.perfil set rol = 'admin' where id = '00000000-0000-0000-0000-0000000000c1' $$,
  'P0001', null,
  'nadie puede cambiarse al rol admin'
);

-- Como artesana -----------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);

select throws_ok(
  $$ insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion)
     values ('00000000-0000-0000-0000-0000000000b1', 'artesano', 'Rosa', '+51999999999',
             'Lobitos', 'RNA-1', 'aprobada') $$,
  '42501', null,
  'una artesana no puede darse de alta ya aprobada'
);

select throws_ok(
  $$ insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion, acreditacion_nota)
     values ('00000000-0000-0000-0000-0000000000b1', 'artesano', 'Rosa', '+51999999999',
             'Lobitos', 'RNA-1', 'pendiente', 'Aprobado por el admin') $$,
  '42501', null,
  'una artesana no puede crearse con una nota de administrador'
);

select lives_ok(
  $$ insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion)
     values ('00000000-0000-0000-0000-0000000000b1', 'artesano', 'Rosa', '+51999999999',
             'Lobitos', 'RNA-1', 'pendiente') $$,
  'una artesana se registra pendiente'
);

select throws_ok(
  $$ update public.perfil set acreditacion = 'aprobada'
     where id = '00000000-0000-0000-0000-0000000000b1' $$,
  'P0001', null,
  'una artesana no puede aprobarse a sí misma'
);

select throws_ok(
  $$ select public.resolver_acreditacion('00000000-0000-0000-0000-0000000000b1', 'aprobada') $$,
  'P0001', null,
  'un no admin no puede usar resolver_acreditacion'
);

-- Como comprador: no ve ni modifica perfiles ajenos -------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);

select is_empty(
  $$ select rna_numero from public.perfil where id = '00000000-0000-0000-0000-0000000000b1' $$,
  'un usuario no lee el perfil ni el RNA de otro'
);

update public.perfil set nombre = 'Hackeado' where id = '00000000-0000-0000-0000-0000000000b1';

-- Anónimo: solo artesanos aprobados ----------------------------------------
reset role;
select is(
  (select nombre from public.perfil where id = '00000000-0000-0000-0000-0000000000b1'),
  'Rosa',
  'un usuario no modifica el perfil de otro'
);

insert into public.perfil (id, rol, nombre, whatsapp, lugar, rna_numero, acreditacion)
values ('00000000-0000-0000-0000-0000000000b2', 'artesano', 'Luis', '+51988888888',
        'Máncora', 'RNA-2', 'aprobada');

set local role anon;
select results_eq(
  $$ select nombre from public.artesano_publico $$,
  $$ values ('Luis'::text) $$,
  'el visitante solo ve artesanos aprobados'
);

select is_empty(
  $$ select 1 from public.perfil $$,
  'el visitante no lee la tabla perfil'
);

-- Como admin --------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select lives_ok(
  $$ select public.resolver_acreditacion('00000000-0000-0000-0000-0000000000b1', 'aprobada') $$,
  'el admin aprueba una solicitud'
);

-- La artesana corrige su RNA: vuelve a revisión ----------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
update public.perfil set rna_numero = 'RNA-1-B' where id = '00000000-0000-0000-0000-0000000000b1';

reset role;
select is(
  (select acreditacion::text from public.perfil where id = '00000000-0000-0000-0000-0000000000b1'),
  'pendiente',
  'cambiar el RNA devuelve la acreditación a pendiente'
);

select is(
  (select acreditacion::text from public.perfil where id = '00000000-0000-0000-0000-0000000000b2'),
  'aprobada',
  'la acreditación de otro artesano no cambia'
);

select * from finish();
rollback;
