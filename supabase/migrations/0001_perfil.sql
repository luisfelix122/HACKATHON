-- PRP 012 · Perfil, roles y acreditación (docs/contratos.md §perfil, §Acceso, §Permisos).
-- Núcleo: los módulos agregan sus funciones en su propio bloque (0101+, 0201+, 0301+).

create type public.rol as enum ('comprador', 'artesano', 'admin');
create type public.acreditacion as enum ('pendiente', 'aprobada', 'rechazada');

create table public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol not null,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  -- Lista preliminar de lugares (§Convenciones). Igual a src/compartido/dominio/lugares.ts.
  lugar text check (
    lugar in ('Máncora', 'Lobitos', 'Cabo Blanco', 'El Ñuro', 'Los Órganos',
              'El Alto', 'Pariñas', 'Colán', 'Punta Sal')
  ),
  asociacion text check (char_length(asociacion) <= 120),
  historia text check (char_length(historia) <= 600),
  rna_numero text check (char_length(btrim(rna_numero)) between 1 and 40),
  acreditacion public.acreditacion,
  acreditacion_nota text check (char_length(acreditacion_nota) <= 300),
  creado_en timestamptz not null default now(),
  constraint artesano_completo check (
    rol <> 'artesano'
    or (whatsapp is not null and lugar is not null and rna_numero is not null and acreditacion is not null)
  ),
  constraint solo_artesano_acredita check (rol = 'artesano' or (acreditacion is null and acreditacion_nota is null))
);

comment on table public.perfil is
  'Perfil 1:1 con auth.users. El rol y la acreditación solo los cambia un administrador.';

-- ---------------------------------------------------------------------------
-- Funciones auxiliares. security definer: las políticas RLS las consultan sin
-- recursión sobre la propia tabla.
-- ---------------------------------------------------------------------------
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.perfil where id = auth.uid() and rol = 'admin');
$$;

create function public.es_artesano_aprobado(usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfil
    where id = usuario and rol = 'artesano' and acreditacion = 'aprobada'
  );
$$;

-- La acreditación de un artesano nuevo empieza en pendiente (§perfil). Un
-- comprador no tiene acreditación, así que la columna no lleva valor por defecto.
create function public.perfil_valores_iniciales()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.rol = 'artesano' and new.acreditacion is null then
    new.acreditacion := 'pendiente';
  end if;
  return new;
end;
$$;

create trigger perfil_valores_iniciales
before insert on public.perfil
for each row execute function public.perfil_valores_iniciales();

-- El propio usuario no cambia su rol, su acreditación ni la nota. Sin auth.uid()
-- (SQL, service role, seed.sql) no se aplica: así se asigna el administrador.
-- Si un artesano corrige su RNA, la solicitud vuelve a pendiente (docs/dominio.md).
create function public.proteger_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
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

  if new.rol = 'artesano' and new.rna_numero is distinct from old.rna_numero then
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

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.perfil enable row level security;

create policy perfil_leer_propio on public.perfil
  for select to authenticated
  using (id = auth.uid() or public.es_admin());

-- Alta propia: comprador sin acreditación (web) o artesano pendiente (APK).
create policy perfil_crear_propio on public.perfil
  for insert to authenticated
  with check (
    id = auth.uid()
    and acreditacion_nota is null
    and (
      (rol = 'comprador' and acreditacion is null)
      -- perfil_valores_iniciales ya puso pendiente: WITH CHECK ve la fila después del trigger.
      or (rol = 'artesano' and acreditacion = 'pendiente')
    )
  );

-- Cada usuario edita solo su fila; el administrador resuelve acreditaciones
-- con la RPC resolver_acreditacion (PRP 001), no con update directo.
create policy perfil_actualizar_propio on public.perfil
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Vista pública: campos públicos de artesanos aprobados (§Reglas por rol).
-- Corre con los permisos de su dueño para no abrir la tabla perfil al visitante.
-- ---------------------------------------------------------------------------
create view public.artesano_publico
with (security_invoker = false)
as
select id, nombre, lugar, asociacion, historia, whatsapp
from public.perfil
where rol = 'artesano' and acreditacion = 'aprobada';

comment on view public.artesano_publico is
  'Campos públicos (nombre, lugar, asociación, historia, WhatsApp) de artesanos aprobados.';

revoke all on public.artesano_publico from public, anon, authenticated;
grant select on public.artesano_publico to anon, authenticated;
