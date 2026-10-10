-- CU-01 · Perfil, roles y acreditación RNA (docs/contratos.md §perfil, §Acceso, §Permisos).

create type public.rol as enum ('comprador', 'artesano', 'admin');
create type public.acreditacion as enum ('pendiente', 'aprobada', 'rechazada');

-- Lista preliminar de lugares (docs/contratos.md §Convenciones). Debe coincidir
-- con src/compartido/dominio/lugares.ts.
create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol not null,
  nombre text not null check (char_length(nombre) between 1 and 120),
  whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  lugar text check (
    lugar in ('Máncora', 'Lobitos', 'Cabo Blanco', 'El Ñuro', 'Los Órganos',
              'El Alto', 'Pariñas', 'Colán', 'Punta Sal')
  ),
  asociacion text check (char_length(asociacion) <= 120),
  historia text check (char_length(historia) <= 600),
  rna_numero text check (char_length(rna_numero) between 1 and 40),
  acreditacion public.acreditacion,
  acreditacion_nota text check (char_length(acreditacion_nota) <= 300),
  creado_en timestamptz not null default now(),
  constraint artesano_completo check (
    rol <> 'artesano'
    or (whatsapp is not null and lugar is not null and rna_numero is not null
        and acreditacion is not null)
  ),
  constraint solo_artesano_acredita check (rol = 'artesano' or acreditacion is null)
);

comment on table public.perfil is 'Perfil 1:1 con auth.users. Rol y acreditación solo los cambia un admin.';

-- Funciones auxiliares. security definer para poder consultarlas desde las
-- políticas RLS sin recursión sobre la propia tabla.
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.perfil where id = auth.uid() and rol = 'admin');
$$;

create function public.es_artesano_aprobado(usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfil
    where id = usuario and rol = 'artesano' and acreditacion = 'aprobada'
  );
$$;

-- Protege rol y acreditación frente a cambios hechos por el propio usuario.
-- Sin auth.uid() (SQL Editor, service role) no se aplica: así se crea el admin.
create function public.proteger_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.es_admin() then
    return new;
  end if;

  if new.id <> old.id or new.rol <> old.rol then
    raise exception 'no_autorizado: no puedes cambiar tu rol';
  end if;

  if new.acreditacion_nota is distinct from old.acreditacion_nota then
    raise exception 'no_autorizado: la nota de acreditación la escribe un administrador';
  end if;

  -- Si el artesano corrige su RNA, la solicitud vuelve a revisión (docs/dominio.md).
  if new.rna_numero is distinct from old.rna_numero then
    new.acreditacion := 'pendiente';
    return new;
  end if;

  if new.acreditacion is distinct from old.acreditacion then
    raise exception 'no_autorizado: la acreditación la cambia un administrador';
  end if;

  return new;
end;
$$;

create trigger proteger_perfil
before update on public.perfil
for each row execute function public.proteger_perfil();

alter table public.perfil enable row level security;

create policy perfil_leer_propio on public.perfil
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

-- Alta propia: solo comprador sin acreditación o artesano pendiente.
create policy perfil_crear_propio on public.perfil
  for insert to authenticated
  with check (
    id = auth.uid()
    and acreditacion_nota is null
    and (
      (rol = 'comprador' and acreditacion is null)
      or (rol = 'artesano' and acreditacion = 'pendiente')
    )
  );

-- Cada usuario actualiza solo su fila. El admin no edita perfiles ajenos
-- directamente: usa resolver_acreditacion (solo acreditación y nota).
create policy perfil_actualizar_propio on public.perfil
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create function public.resolver_acreditacion(
  artesano uuid,
  resultado public.acreditacion,
  nota text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $
begin
  if not public.es_admin() then
    raise exception 'no_autorizado: solo un administrador resuelve acreditaciones';
  end if;
  if resultado = 'pendiente' then
    raise exception 'transicion_invalida: el resultado debe ser aprobada o rechazada';
  end if;
  if resultado = 'rechazada' and coalesce(btrim(nota), '') = '' then
    raise exception 'datos_incompletos: el rechazo necesita un motivo';
  end if;

  update public.perfil
  set acreditacion = resultado,
      acreditacion_nota = case when resultado = 'rechazada' then btrim(nota) end
  where id = artesano and rol = 'artesano';

  if not found then
    raise exception 'datos_incompletos: el perfil no existe o no es de un artesano';
  end if;
end;
$;

revoke execute on function public.resolver_acreditacion(uuid, public.acreditacion, text) from public, anon;
grant execute on function public.resolver_acreditacion(uuid, public.acreditacion, text) to authenticated;

-- Vista pública: solo campos públicos de artesanos aprobados. Se ejecuta con
-- los permisos de su dueño a propósito, para no exponer rna_numero ni la nota.
create view public.artesano_publico as
  select id, nombre, lugar, asociacion, historia, whatsapp
  from public.perfil
  where rol = 'artesano' and acreditacion = 'aprobada';

grant select on public.artesano_publico to anon, authenticated;
