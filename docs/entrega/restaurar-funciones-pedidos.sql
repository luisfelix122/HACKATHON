-- Solo si faltan las RPC CU06 o difieren del contrato local. Sobre tablas Ayllu existentes.
-- Reinstala las definiciones del repositorio; conserva datos.
BEGIN;
-- CU-06: transiciones atómicas; ninguna reserva o modificación del producto.
create or replace function public.aceptar_orden(orden_id uuid, costo_envio numeric, total numeric, fecha_entrega_estimada date)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('solicitada') then raise exception 'transicion_invalida'; end if;
  if $3 is null or round($3,2) <= 0 or $3::text in ('NaN','Infinity','-Infinity') or $3 > 99999999.99
    or $4 is null or $4 < (now() at time zone 'America/Lima')::date
    or (actual.modalidad='envio' and ($2 is null or $2 < 0 or $2::text in ('NaN','Infinity','-Infinity') or $2 > 99999999.99))
    or (actual.modalidad='recojo' and $2 is not null and $2 <> 0)
    then raise exception 'datos_incompletos'; end if;
  update public.orden o set total=$3, costo_envio=case when actual.modalidad='envio' then $2 else 0 end, fecha_entrega_estimada=$4, estado='aceptada'
    where o.id=$1 and o.estado::text in ('solicitada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.aceptar_orden(uuid,numeric,numeric,date) from public, anon;
grant execute on function public.aceptar_orden(uuid,numeric,numeric,date) to authenticated;

create or replace function public.rechazar_orden(orden_id uuid, motivo text default null)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('solicitada') then raise exception 'transicion_invalida'; end if;
  
  update public.orden o set estado='rechazada'
    where o.id=$1 and o.estado::text in ('solicitada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.rechazar_orden(uuid,text) from public, anon;
grant execute on function public.rechazar_orden(uuid,text) to authenticated;

create or replace function public.confirmar_total(orden_id uuid)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (actual.comprador_id = actor and rol_actor = 'comprador') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('aceptada') then raise exception 'transicion_invalida'; end if;
  
  update public.orden o set estado='confirmada'
    where o.id=$1 and o.estado::text in ('aceptada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.confirmar_total(uuid) from public, anon;
grant execute on function public.confirmar_total(uuid) to authenticated;

create or replace function public.enviar_enlace_pago(orden_id uuid, enlace_pago text)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('confirmada') then raise exception 'transicion_invalida'; end if;
  if $2 is null or $2 !~ '^https://[^[:space:]/?#]+[^[:space:]]*$' then raise exception 'datos_incompletos'; end if;
  update public.orden o set enlace_pago=$2, estado='pago_pendiente'
    where o.id=$1 and o.estado::text in ('confirmada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.enviar_enlace_pago(uuid,text) from public, anon;
grant execute on function public.enviar_enlace_pago(uuid,text) to authenticated;

create or replace function public.verificar_abono(orden_id uuid)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('pago_pendiente') then raise exception 'transicion_invalida'; end if;
  
  update public.orden o set estado='pagada'
    where o.id=$1 and o.estado::text in ('pago_pendiente') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.verificar_abono(uuid) from public, anon;
grant execute on function public.verificar_abono(uuid) to authenticated;

create or replace function public.marcar_enviada(orden_id uuid, numero_guia text)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('pagada') then raise exception 'transicion_invalida'; end if;
  if actual.modalidad <> 'envio' then raise exception 'transicion_invalida'; end if;
  if $2 is null or char_length(btrim($2)) not between 1 and 60 then raise exception 'datos_incompletos'; end if;
  update public.orden o set numero_guia=btrim($2), estado='enviada'
    where o.id=$1 and o.estado::text in ('pagada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.marcar_enviada(uuid,text) from public, anon;
grant execute on function public.marcar_enviada(uuid,text) to authenticated;

create or replace function public.marcar_lista_recojo(orden_id uuid)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('pagada') then raise exception 'transicion_invalida'; end if;
  if actual.modalidad <> 'recojo' then raise exception 'transicion_invalida'; end if;
  update public.orden o set estado='lista_para_recojo'
    where o.id=$1 and o.estado::text in ('pagada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.marcar_lista_recojo(uuid) from public, anon;
grant execute on function public.marcar_lista_recojo(uuid) to authenticated;

create or replace function public.marcar_entregada(orden_id uuid)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('enviada','lista_para_recojo') then raise exception 'transicion_invalida'; end if;
  
  update public.orden o set estado='entregada'
    where o.id=$1 and o.estado::text in ('enviada','lista_para_recojo') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.marcar_entregada(uuid) from public, anon;
grant execute on function public.marcar_entregada(uuid) to authenticated;

create or replace function public.cancelar_orden(orden_id uuid, motivo text default null)
returns public.orden
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actual public.orden;
  cambiada public.orden;
  dueno uuid;
  rol_actor text;
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or ((dueno = actor and rol_actor = 'artesano') or (actual.comprador_id = actor and rol_actor = 'comprador')) is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('aceptada','confirmada','pago_pendiente') then raise exception 'transicion_invalida'; end if;
  
  update public.orden o set estado='cancelada'
    where o.id=$1 and o.estado::text in ('aceptada','confirmada','pago_pendiente') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
revoke all on function public.cancelar_orden(uuid,text) from public, anon;
grant execute on function public.cancelar_orden(uuid,text) to authenticated;


NOTIFY pgrst, 'reload schema';
COMMIT;
