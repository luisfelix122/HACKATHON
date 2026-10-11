-- CU-05: única entrada de creación; orden no admite INSERT desde el cliente.
create function public.crear_orden(producto_id uuid, cantidad integer, modalidad text,
  datos_envio jsonb default null, detalle text default null)
returns public.orden
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  pieza public.producto;
  creada public.orden;
begin
  if actor is null or not exists(select 1 from public.perfil p where p.id = actor and p.rol = 'comprador') then
    raise exception 'no_autorizado';
  end if;
  if cantidad is null or cantidad < 1 or modalidad is null or modalidad not in ('recojo','envio')
     or char_length(detalle) > 1000 then raise exception 'datos_incompletos'; end if;
  if modalidad = 'envio' then
    -- Comprobar objeto antes de llamar al validador compartido (jsonb_each).
    if datos_envio is null or jsonb_typeof(datos_envio) <> 'object' then raise exception 'datos_incompletos'; end if;
    if public.datos_envio_validos(datos_envio) is not true then raise exception 'datos_incompletos'; end if;
  elsif datos_envio is not null then raise exception 'datos_incompletos'; end if;
  -- Bloquea cambios concurrentes de publicación durante esta solicitud, no reserva stock.
  select p.* into pieza from public.producto p where p.id = producto_id for share;
  if not found or pieza.estado <> 'publicado' then raise exception 'transicion_invalida'; end if;
  if pieza.artesano_id = actor then raise exception 'no_autorizado'; end if;
  insert into public.orden(producto_id,comprador_id,cantidad,modalidad,datos_envio,detalle)
    values(pieza.id,actor,cantidad,modalidad::public.modalidad,datos_envio,nullif(btrim(detalle),'')) returning * into creada;
  return creada;
end;
$$;
revoke all on function public.crear_orden(uuid,integer,text,jsonb,text) from public, anon;
grant execute on function public.crear_orden(uuid,integer,text,jsonb,text) to authenticated;
