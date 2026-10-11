-- Aplicar en SQL Editor sobre esquema Ayllu existente. No modifica roles ni elimina datos.
BEGIN;
-- Publicación y edición de productos mediante una operación atómica del propietario.
create or replace function public.publicar_producto(
  p_producto_id uuid,
  p_ficha jsonb,
  p_precio_final numeric,
  p_disponibilidad public.disponibilidad,
  p_plazo_dias integer,
  p_fotos jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pieza public.producto%rowtype;
  cantidad integer;
begin
  select * into pieza from public.producto where id = p_producto_id for update;
  if not found or auth.uid() is null or pieza.artesano_id <> auth.uid()
     or not public.es_artesano_aprobado(auth.uid()) then
    raise exception 'no_autorizado: necesitas ser el artesano propietario y estar acreditado';
  end if;
  if pieza.estado not in ('borrador', 'en_revision', 'publicado', 'retirado')
     or pieza.revision_ia = 'rechazada' then
    raise exception 'no_autorizado: esta pieza no puede publicarse o actualizarse';
  end if;
  if p_ficha is null or not public.ficha_valida(p_ficha)
     or nullif(btrim(p_ficha ->> 'tecnica'), '') is null
     or p_precio_final is null or p_precio_final <= 0
     or p_precio_final::text in ('NaN', 'Infinity', '-Infinity')
     or p_disponibilidad is null
     or (p_disponibilidad = 'a_pedido' and (p_plazo_dias is null or p_plazo_dias <= 0)) then
    raise exception 'datos_incompletos: revisa la ficha, el precio y la disponibilidad';
  end if;
  if jsonb_typeof(p_fotos) is distinct from 'array' then
    raise exception 'datos_incompletos: selecciona las fotos del producto';
  end if;
  cantidad := jsonb_array_length(p_fotos);
  if cantidad = 0 or exists (
    select 1 from jsonb_to_recordset(p_fotos) as f(id uuid, publicada boolean, posicion integer)
    where f.id is null or f.publicada is null or f.posicion is null or f.posicion < 0
       or not exists (select 1 from public.foto_producto fp where fp.id = f.id and fp.producto_id = p_producto_id)
  ) or cantidad <> (
    select count(distinct f.id) from jsonb_to_recordset(p_fotos) as f(id uuid)
  ) or not exists (
    select 1 from jsonb_to_recordset(p_fotos) as f(publicada boolean) where f.publicada
  ) then
    raise exception 'datos_incompletos: elige al menos una foto válida del producto';
  end if;

  -- Seleccionar las nuevas fotos antes de retirar las anteriores evita dejar
  -- momentáneamente sin foto un producto ya publicado.
  update public.foto_producto fp set publicada = true, posicion = f.posicion
  from jsonb_to_recordset(p_fotos) as f(id uuid, publicada boolean, posicion integer)
  where fp.id = f.id and fp.producto_id = p_producto_id and f.publicada;

  update public.foto_producto fp set publicada = false
  where fp.producto_id = p_producto_id and fp.publicada
    and not exists (
      select 1 from jsonb_to_recordset(p_fotos) as f(id uuid, publicada boolean)
      where f.id = fp.id and f.publicada
    );

  update public.foto_producto fp set posicion = f.posicion
  from jsonb_to_recordset(p_fotos) as f(id uuid, posicion integer)
  where fp.id = f.id and fp.producto_id = p_producto_id;

  update public.producto set estado = 'publicado', ficha = p_ficha,
    precio_final = p_precio_final, disponibilidad = p_disponibilidad,
    plazo_dias = case when p_disponibilidad = 'a_pedido' then p_plazo_dias else null end
  where id = p_producto_id;
end;
$$;
revoke all on function public.publicar_producto(uuid, jsonb, numeric, public.disponibilidad, integer, jsonb) from public, anon;
grant execute on function public.publicar_producto(uuid, jsonb, numeric, public.disponibilidad, integer, jsonb) to authenticated;
notify pgrst, 'reload schema';

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

COMMIT;
