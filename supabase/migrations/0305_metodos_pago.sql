-- CU-06: el artesano cobra por Yape, Plin o cuenta bancaria. El enlace de pago
-- pasa a ser opcional: basta un método de pago guardado o un enlace https.

create type public.tipo_metodo_pago as enum ('yape', 'plin', 'cuenta_bancaria');

create table public.metodo_pago (
  id uuid primary key default gen_random_uuid(),
  artesano_id uuid not null references public.perfil (id) on delete cascade,
  tipo public.tipo_metodo_pago not null,
  titular text not null check (char_length(btrim(titular)) between 1 and 80),
  -- Celular para Yape/Plin; número de cuenta para un banco.
  numero text not null check (numero ~ '^[0-9][0-9 -]{4,28}[0-9]$'),
  banco text check (char_length(btrim(banco)) between 1 and 60),
  cci text check (cci ~ '^[0-9]{20}$'),
  -- Imagen del QR en el bucket `cobros`: {artesano_id}/<archivo>.
  qr_ruta text check (char_length(qr_ruta) <= 200),
  creado_en timestamptz not null default now(),
  constraint banco_segun_tipo check ((tipo = 'cuenta_bancaria') = (banco is not null)),
  constraint cci_solo_cuenta check (cci is null or tipo = 'cuenta_bancaria'),
  constraint qr_solo_billetera check (qr_ruta is null or tipo in ('yape', 'plin')),
  constraint qr_en_carpeta_propia check (qr_ruta is null or split_part(qr_ruta, '/', 1) = artesano_id::text)
);

create index metodo_pago_artesano_idx on public.metodo_pago (artesano_id);

-- El comprador ve los métodos del artesano solo mientras le debe un pago.
create function public.puede_ver_metodos_pago(artesano uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orden o
    join public.producto p on p.id = o.producto_id
    where o.comprador_id = (select auth.uid())
      and p.artesano_id = artesano
      and o.estado = 'pago_pendiente'
  );
$$;
revoke all on function public.puede_ver_metodos_pago(uuid) from public, anon;
grant execute on function public.puede_ver_metodos_pago(uuid) to authenticated;

alter table public.metodo_pago enable row level security;

create policy metodo_pago_propios on public.metodo_pago
  for all to authenticated
  using (artesano_id = (select auth.uid()))
  with check (
    artesano_id = (select auth.uid())
    and exists (select 1 from public.perfil p where p.id = artesano_id and p.rol = 'artesano')
  );

create policy metodo_pago_comprador on public.metodo_pago
  for select to authenticated
  using (public.puede_ver_metodos_pago(artesano_id));

-- QR de cobro: lectura pública (se muestra al comprador), escritura solo en la carpeta propia.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cobros', 'cobros', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy cobros_leer on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'cobros');

create policy cobros_subir_propios on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cobros' and (storage.foldername(name))[1] = auth.uid()::text);

create policy cobros_reemplazar_propios on storage.objects
  for update to authenticated
  using (bucket_id = 'cobros' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cobros' and (storage.foldername(name))[1] = auth.uid()::text);

create policy cobros_borrar_propios on storage.objects
  for delete to authenticated
  using (bucket_id = 'cobros' and (storage.foldername(name))[1] = auth.uid()::text);

-- `pago_pendiente` ya no exige enlace: puede pagarse con los métodos guardados.
alter table public.orden drop constraint enlace_desde_pago_pendiente;

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
  enlace text := nullif(btrim($2), '');
begin
  select o.* into actual from public.orden o where o.id=$1;
  select p.artesano_id into dueno from public.producto p where p.id=actual.producto_id;
  select p.rol::text into rol_actor from public.perfil p where p.id=actor;
  if actor is null or (dueno = actor and rol_actor = 'artesano') is not true then raise exception 'no_autorizado'; end if;
  if actual.estado::text not in ('confirmada') then raise exception 'transicion_invalida'; end if;
  if enlace is not null and enlace !~ '^https://[^[:space:]/?#]+[^[:space:]]*$' then raise exception 'datos_incompletos'; end if;
  if enlace is null and not exists (select 1 from public.metodo_pago m where m.artesano_id = dueno) then
    raise exception 'datos_incompletos';
  end if;
  update public.orden o set enlace_pago=enlace, estado='pago_pendiente'
    where o.id=$1 and o.estado::text in ('confirmada') returning o.* into cambiada;
  if not found then raise exception 'transicion_invalida'; end if;
  return cambiada;
end;
$$;
