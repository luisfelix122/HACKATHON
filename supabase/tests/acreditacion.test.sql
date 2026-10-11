begin;
create extension if not exists pgtap with schema extensions;
select plan(6);
-- Reutiliza los usuarios del seed, sin crear datos de demo fuera de seed.sql.
update public.perfil set rol = 'admin', acreditacion = null, acreditacion_nota = null
where id = '00000000-0000-0000-0000-000000000090';
update public.perfil set acreditacion = 'pendiente' where id = '00000000-0000-0000-0000-000000000001';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
select throws_ok($$select public.resolver_acreditacion('00000000-0000-0000-0000-000000000001', 'aprobada', null)$$,
  'P0001', 'no_autorizado', 'un artesano no se aprueba');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000090","role":"authenticated"}', true);
select throws_ok($$select public.resolver_acreditacion('00000000-0000-0000-0000-000000000001', 'rechazada', '  ')$$,
  'P0001', 'datos_incompletos', 'rechazar exige motivo');
select lives_ok($$select public.resolver_acreditacion('00000000-0000-0000-0000-000000000001', 'aprobada', null)$$, 'admin aprueba');
select is((select acreditacion::text from public.perfil where id = '00000000-0000-0000-0000-000000000001'), 'aprobada', 'aprobación persistida');
select lives_ok($$select public.resolver_acreditacion('00000000-0000-0000-0000-000000000001', 'rechazada', 'RNA no verificable')$$, 'admin rechaza');
select is((select acreditacion_nota from public.perfil where id = '00000000-0000-0000-0000-000000000001'), 'RNA no verificable', 'motivo persistido');
select * from finish();
rollback;
