-- CU-06: métodos de pago del artesano y enlace de pago opcional. Solo base local aislada.
begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into auth.users(id,email,aud,role) values
 ('e5000000-0000-4000-8000-000000000001','cobro-art@prueba.test','authenticated','authenticated'),
 ('e5000000-0000-4000-8000-000000000002','cobro-comp@prueba.test','authenticated','authenticated'),
 ('e5000000-0000-4000-8000-000000000003','cobro-otro@prueba.test','authenticated','authenticated');
insert into public.perfil(id,rol,nombre,whatsapp,lugar,rna_numero,acreditacion) values
 ('e5000000-0000-4000-8000-000000000001','artesano','Artesano','+51911111111','Lobitos','RNA-06','aprobada');
insert into public.perfil(id,rol,nombre) values
 ('e5000000-0000-4000-8000-000000000002','comprador','Comprador'),
 ('e5000000-0000-4000-8000-000000000003','comprador','Otro');
insert into public.producto(id,artesano_id,estado,nombre,ficha,precio_final,disponibilidad) values
 ('e6000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000001','publicado','Pieza',
  '{"titulo":"Pieza","descripcion":"Hecha a mano.","materiales":["algodón"],"tecnica":"tejido","tipo_producto":"textil","historia_pieza":"","etiquetas":[]}',40,'en_stock');
insert into public.orden(id,producto_id,comprador_id,cantidad,modalidad,total,costo_envio,fecha_entrega_estimada,estado) values
 ('e7000000-0000-4000-8000-000000000001','e6000000-0000-4000-8000-000000000001','e5000000-0000-4000-8000-000000000002',1,'recojo',40,0,current_date+1,'confirmada');

-- Sin enlace ni métodos guardados no hay cómo pagar.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select throws_ok($$select public.enviar_enlace_pago('e7000000-0000-4000-8000-000000000001',null)$$,'P0001','datos_incompletos','sin enlace ni métodos');
select throws_ok($$select public.enviar_enlace_pago('e7000000-0000-4000-8000-000000000001','http://pago.example')$$,'P0001','datos_incompletos','enlace sin https');

-- El artesano guarda sus métodos.
select lives_ok($$insert into public.metodo_pago(artesano_id,tipo,titular,numero,qr_ruta) values ('e5000000-0000-4000-8000-000000000001','yape','Artesano','900 000 001','e5000000-0000-4000-8000-000000000001/yape.png')$$,'guarda Yape con QR');
select lives_ok($$insert into public.metodo_pago(artesano_id,tipo,titular,numero,banco,cci) values ('e5000000-0000-4000-8000-000000000001','cuenta_bancaria','Artesano','000-0000000-0-01','Banco Demo','00000000000000000001')$$,'guarda cuenta bancaria');
select throws_ok($$insert into public.metodo_pago(artesano_id,tipo,titular,numero) values ('e5000000-0000-4000-8000-000000000001','cuenta_bancaria','Artesano','000-0000000-0-02')$$,'23514',null,'cuenta sin banco');
select throws_ok($$insert into public.metodo_pago(artesano_id,tipo,titular,numero,qr_ruta) values ('e5000000-0000-4000-8000-000000000001','plin','Artesano','900 000 002','otra-carpeta/plin.png')$$,'23514',null,'QR fuera de su carpeta');

-- Antes del pago, el comprador no ve los métodos.
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*)::int from public.metodo_pago),0,'comprador sin pago pendiente no ve métodos');
select throws_ok($$insert into public.metodo_pago(artesano_id,tipo,titular,numero) values ('e5000000-0000-4000-8000-000000000001','plin','Intruso','900 000 009')$$,'42501',null,'comprador no crea métodos ajenos');

-- Con métodos guardados el enlace es opcional.
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select lives_ok($$select public.enviar_enlace_pago('e7000000-0000-4000-8000-000000000001',null)$$,'pide el pago sin enlace');
select is((select estado::text from public.orden where id='e7000000-0000-4000-8000-000000000001'),'pago_pendiente','queda pago_pendiente');
select is((select enlace_pago from public.orden where id='e7000000-0000-4000-8000-000000000001'),null,'sin enlace guardado');

-- Con el pago pendiente, solo su comprador ve los métodos.
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select is((select count(*)::int from public.metodo_pago),2,'comprador con pago pendiente ve los métodos');
select set_config('request.jwt.claims','{"sub":"e5000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
select is((select count(*)::int from public.metodo_pago),0,'un tercero no ve los métodos');
reset role;

select * from finish();
rollback;
