-- PRP 004. Usa exclusivamente la muestra de seed.sql; los cambios se revierten.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);
select has_view('public', 'producto_publico', 'existe el catálogo público');
select has_view('public', 'foto_publica', 'existen las fotos públicas');
select hasnt_column('public', 'producto_publico', 'rna_numero', 'no expone RNA');
select hasnt_column('public', 'producto_publico', 'acreditacion_nota', 'no expone nota privada');
select hasnt_column('public', 'producto_publico', 'costeo', 'no expone costeo privado');
select ok((select count(*) >= 8 from public.producto where estado = 'publicado'), 'hay muestra suficiente');
-- Un artesano pierde la acreditación después de publicar.
update public.perfil set acreditacion = 'pendiente'
where id = '00000000-0000-0000-0000-000000000001';
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select ok((select count(*) > 0 from public.producto_publico), 'anon puede explorar sin sesión');
select is((select count(*)::int from public.producto_publico where artesano_id = '00000000-0000-0000-0000-000000000001'), 0, 'oculta productos de artesano pendiente');
select is((select count(*)::int from public.producto_publico where id = '10000000-0000-0000-0000-000000000022'), 0, 'oculta producto retirado');
select is((select count(*)::int from public.foto_publica where producto_id = '10000000-0000-0000-0000-000000000022'), 0, 'oculta fotos de producto retirado');
select is((select count(*)::int from public.foto_publica f where not exists (select 1 from public.producto_publico p where p.id = f.producto_id)), 0, 'todas las fotos pertenecen a productos visibles');
select throws_ok($$select rna_numero from public.producto_publico$$, '42703', null, 'anon no obtiene RNA');
select throws_ok($$select acreditacion_nota from public.producto_publico$$, '42703', null, 'anon no obtiene nota privada');
select * from finish();
rollback;
