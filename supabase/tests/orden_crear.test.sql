-- CU-05: ejecutar solo en Supabase local aislado, nunca en la BD compartida.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);
select has_function('public', 'crear_orden', array['uuid','integer','text','jsonb','text']);
insert into auth.users(id,email,aud,role) values
 ('d0000000-0000-4000-8000-000000000001','cu05-art@prueba.test','authenticated','authenticated'),
 ('d0000000-0000-4000-8000-000000000002','cu05-comp@prueba.test','authenticated','authenticated'),
 ('d0000000-0000-4000-8000-000000000003','cu05-otro@prueba.test','authenticated','authenticated');
insert into public.perfil(id,rol,nombre,whatsapp,lugar,rna_numero,acreditacion) values
 ('d0000000-0000-4000-8000-000000000001','artesano','Artesano','+51911111111','Lobitos','RNA-05','aprobada');
insert into public.perfil(id,rol,nombre) values
 ('d0000000-0000-4000-8000-000000000002','comprador','Comprador'),
 ('d0000000-0000-4000-8000-000000000003','comprador','Otro');
insert into public.producto(id,artesano_id,estado,nombre,ficha,precio_final,disponibilidad) values
 ('d1000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','publicado','Pieza',
  '{"titulo":"Pieza","descripcion":"Hecha a mano.","materiales":["algodón"],"tecnica":"tejido","tipo_producto":"textil","historia_pieza":"","etiquetas":[]}',40,'en_stock'),
 ('d1000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000001','borrador','Borrador',null,40,'en_stock');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"d0000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select throws_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000002',1,'recojo')$$,'P0001','transicion_invalida','no publicado');
select throws_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000001',0,'recojo')$$,'P0001','datos_incompletos','cantidad cero');
select throws_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000001',null,'recojo')$$,'P0001','datos_incompletos','cantidad nula');
select throws_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000001',1,'otra')$$,'P0001','datos_incompletos','modalidad inválida');
select throws_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000001',1,'envio','{}')$$,'P0001','datos_incompletos','envío incompleto');
select lives_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000001',1,'recojo')$$,'recojo válido');
select is((select estado::text from public.orden limit 1),'solicitada','estado inicial');
select is((select comprador_id::text from public.orden limit 1),'d0000000-0000-4000-8000-000000000002','actor de auth.uid');
select is((select total from public.orden limit 1),null::numeric,'sin total inventado');
select lives_ok($$insert into public.mensaje_orden(orden_id,autor_id,texto_original) select id,auth.uid(),'Hola' from public.orden limit 1$$,'comprador escribe');
select set_config('request.jwt.claims','{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select throws_ok($$select public.crear_orden('d1000000-0000-4000-8000-000000000001',1,'recojo')$$,'P0001','no_autorizado','no pide su pieza');
select is((select count(*)::int from public.orden),1,'artesano ve su orden');
select set_config('request.jwt.claims','{"sub":"d0000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.orden),0,'tercero no ve orden');
select is((select count(*)::int from public.mensaje_orden),0,'tercero no ve hilo');
reset role;
select * from finish();
rollback;
