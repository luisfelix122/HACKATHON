-- Nombres visibles solo a comprador y artesano del pedido. Perfil continúa privado.
create or replace function public.listar_pedidos()
returns setof jsonb
language sql stable security definer set search_path = ''
as $$
  select pg_catalog.to_jsonb(o) || pg_catalog.jsonb_build_object(
    'nombre_producto', p.nombre,
    'artesano_id', p.artesano_id,
    'nombre_contraparte', case when o.comprador_id = auth.uid() then artesano.nombre else comprador.nombre end
  )
  from public.orden o
  join public.producto p on p.id = o.producto_id
  left join public.perfil comprador on comprador.id = o.comprador_id
  left join public.perfil artesano on artesano.id = p.artesano_id
  where auth.uid() is not null and (o.comprador_id = auth.uid() or p.artesano_id = auth.uid())
  order by o.creado_en desc;
$$;
revoke all on function public.listar_pedidos() from public, anon;
grant execute on function public.listar_pedidos() to authenticated;

create or replace function public.detalle_pedido(orden_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select pedido from public.listar_pedidos() pedido where (pedido->>'id')::uuid = orden_id;
$$;
revoke all on function public.detalle_pedido(uuid) from public, anon;
grant execute on function public.detalle_pedido(uuid) to authenticated;
notify pgrst, 'reload schema';
