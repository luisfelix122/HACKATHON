-- PRP 012 · Producto, fotos y buckets (docs/contratos.md §producto, §Ficha,
-- §foto_producto, §Archivos, §Permisos). Las transiciones de estado del producto
-- y la función de IA son del módulo A (0102 y procesar-producto).

create type public.estado_producto as enum ('borrador', 'procesando', 'en_revision', 'publicado', 'retirado');
create type public.disponibilidad as enum ('en_stock', 'a_pedido');
create type public.revision_ia as enum ('sin_revisar', 'aprobada', 'rechazada');
create type public.origen_foto as enum ('original', 'ia');
create type public.variante_foto as enum ('estudio', 'luz', 'vitrina', 'contexto');

-- ---------------------------------------------------------------------------
-- Objetos de valor jsonb (§Normalización): se validan completos al escribirse.
-- ---------------------------------------------------------------------------

-- §Ficha. tipo_producto sale de la lista de docs/dominio.md; sin campos extra.
create function public.ficha_valida(ficha jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  materiales jsonb := ficha -> 'materiales';
  etiquetas jsonb := ficha -> 'etiquetas';
begin
  if jsonb_typeof(ficha) is distinct from 'object'
     or ficha - array['titulo', 'descripcion', 'materiales', 'tecnica', 'tipo_producto',
                      'historia_pieza', 'etiquetas'] <> '{}'::jsonb then
    return false;
  end if;

  if jsonb_typeof(ficha -> 'titulo') is distinct from 'string'
     or char_length(btrim(ficha ->> 'titulo')) not between 1 and 80 then
    return false;
  end if;

  if jsonb_typeof(ficha -> 'descripcion') is distinct from 'string'
     or char_length(btrim(ficha ->> 'descripcion')) not between 1 and 1200 then
    return false;
  end if;

  if jsonb_typeof(materiales) is distinct from 'array' or jsonb_array_length(materiales) < 1
     or exists (select 1 from jsonb_array_elements(materiales) m
                where jsonb_typeof(m) <> 'string' or btrim(m #>> '{}') = '') then
    return false;
  end if;

  if jsonb_typeof(ficha -> 'tecnica') is distinct from 'string'
     or char_length(ficha ->> 'tecnica') > 120 then
    return false;
  end if;

  if (ficha ->> 'tipo_producto') is null
     or (ficha ->> 'tipo_producto') not in ('textil', 'bisutería marina', 'tallado', 'utilitario', 'otro') then
    return false;
  end if;

  if jsonb_typeof(ficha -> 'historia_pieza') is distinct from 'string'
     or char_length(ficha ->> 'historia_pieza') > 600 then
    return false;
  end if;

  -- Etiquetas: de 0 a 8, en minúsculas, de 2 a 30 caracteres y sin repetir.
  if jsonb_typeof(etiquetas) is distinct from 'array' or jsonb_array_length(etiquetas) > 8
     or exists (select 1 from jsonb_array_elements(etiquetas) e
                where jsonb_typeof(e) <> 'string'
                   or (e #>> '{}') <> lower(e #>> '{}')
                   or char_length(e #>> '{}') not between 2 and 30)
     or (select count(distinct e #>> '{}') from jsonb_array_elements(etiquetas) e)
        <> jsonb_array_length(etiquetas) then
    return false;
  end if;

  return true;
end;
$$;

-- §producto.costeo: montos en PEN, no negativos. El precio sugerido se calcula, no se guarda.
create function public.costeo_valido(costeo jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(costeo) = 'object'
     and costeo - array['materiales', 'horas', 'pago_hora', 'gastos', 'ganancia'] = '{}'::jsonb
     and (select count(*) = 5 and bool_and(jsonb_typeof(v) = 'number' and (v #>> '{}')::numeric >= 0)
          from jsonb_each(costeo) as c(k, v));
$$;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.producto (
  -- Lo genera el cliente al crear el borrador local: la subida es idempotente.
  id uuid primary key default gen_random_uuid(),
  artesano_id uuid not null references public.perfil (id),
  estado public.estado_producto not null default 'borrador',
  nombre text not null check (char_length(btrim(nombre)) between 1 and 120),
  descripcion_texto text check (char_length(descripcion_texto) <= 2000),
  audio_ruta text check (char_length(audio_ruta) <= 300),
  ficha jsonb check (ficha is null or public.ficha_valida(ficha)),
  costeo jsonb check (costeo is null or public.costeo_valido(costeo)),
  precio_final numeric(10, 2) check (precio_final > 0),
  disponibilidad public.disponibilidad,
  plazo_dias int check (plazo_dias > 0),
  revision_ia public.revision_ia not null default 'sin_revisar',
  comentario_precio_ia text check (char_length(comentario_precio_ia) <= 300),
  ia_error text check (char_length(ia_error) <= 500),
  ia_intentos int not null default 0 check (ia_intentos >= 0),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- a_pedido exige plazo; en_stock no lleva plazo (regla 7).
  constraint plazo_segun_disponibilidad check (
    (coalesce(disponibilidad::text, '') = 'a_pedido') = (plazo_dias is not null)
  ),
  constraint publicado_completo check (
    estado <> 'publicado' or (ficha is not null and precio_final is not null and disponibilidad is not null)
  )
);

create index producto_artesano_idx on public.producto (artesano_id);
create index producto_publicado_idx on public.producto (estado) where estado = 'publicado';

create table public.foto_producto (
  -- La original la genera el cliente, junto con el borrador.
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.producto (id) on delete cascade,
  origen public.origen_foto not null,
  variante public.variante_foto,
  ruta text not null check (char_length(ruta) between 1 and 300),
  publicada boolean not null,
  posicion int not null default 0 check (posicion >= 0),
  creado_en timestamptz not null default now(),
  constraint variante_segun_origen check ((origen = 'ia') = (variante is not null))
);

-- Exactamente una foto original por producto.
create unique index foto_producto_una_original on public.foto_producto (producto_id) where origen = 'original';

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger producto_actualizado_en
before update on public.producto
for each row execute function public.tocar_actualizado_en();

-- El artesano no cambia el dueño ni las columnas que escribe la Edge Function.
-- Sin auth.uid() (service role, SQL) o siendo admin, no se aplica.
create function public.proteger_producto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.es_admin() then
    return new;
  end if;

  if new.id <> old.id or new.artesano_id <> old.artesano_id then
    raise exception 'no_autorizado: no puedes cambiar el dueño del producto';
  end if;

  if new.revision_ia is distinct from old.revision_ia
     or new.comentario_precio_ia is distinct from old.comentario_precio_ia
     or new.ia_error is distinct from old.ia_error
     or new.ia_intentos is distinct from old.ia_intentos then
    raise exception 'no_autorizado: las columnas de la IA las escribe la función de IA';
  end if;

  return new;
end;
$$;

create trigger proteger_producto
before update on public.producto
for each row execute function public.proteger_producto();

-- Pasar a publicado exige acreditación aprobada, revision_ia no rechazada y al
-- menos una foto publicada (regla 1, regla 4 y §Permisos). Vale para todos.
create function public.exigir_acreditacion_para_publicar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.estado <> 'publicado' or old.estado = 'publicado' then
    return new;
  end if;

  if not public.es_artesano_aprobado(new.artesano_id) then
    raise exception 'no_autorizado: tu acreditación todavía no está aprobada';
  end if;

  if new.revision_ia = 'rechazada' then
    raise exception 'no_autorizado: la revisión de la IA rechazó esta pieza';
  end if;

  if not exists (
    select 1 from public.foto_producto
    where producto_id = new.id and publicada
  ) then
    raise exception 'datos_incompletos: elige al menos una foto para publicar';
  end if;

  return new;
end;
$$;

create trigger exigir_acreditacion_para_publicar
before update of estado on public.producto
for each row execute function public.exigir_acreditacion_para_publicar();

-- La original nace publicada y las de IA sin publicar (§foto_producto).
create function public.foto_valores_iniciales()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.origen = 'original' and new.ruta is distinct from (
    select p.artesano_id::text || '/' || p.id::text || '/original.jpg'
    from public.producto p where p.id = new.producto_id
  ) then
    raise exception 'datos_incompletos: la foto original necesita su ruta canónica';
  end if;
  if new.publicada is null then
    new.publicada := new.origen = 'original';
  end if;
  return new;
end;
$$;

create trigger foto_valores_iniciales
before insert on public.foto_producto
for each row execute function public.foto_valores_iniciales();

-- Una foto no cambia de producto ni de origen, y la original nunca se sobrescribe.
create function public.proteger_foto_producto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.producto_id <> old.producto_id or new.origen <> old.origen then
    raise exception 'no_autorizado: una foto no cambia de producto ni de origen';
  end if;

  if old.origen = 'original' and new.ruta <> old.ruta then
    raise exception 'no_autorizado: la foto original no se sobrescribe';
  end if;

  return new;
end;
$$;

create trigger proteger_foto_producto
before update on public.foto_producto
for each row execute function public.proteger_foto_producto();

-- Serializar la retirada de fotos por producto evita que dos operaciones
-- concurrentes retiren las dos últimas fotos elegidas.
create function public.conservar_foto_publicada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  estado_actual public.estado_producto;
begin
  if old.publicada and (tg_op = 'DELETE' or not new.publicada) then
    select estado into estado_actual from public.producto
      where id = old.producto_id for update;
    if estado_actual = 'publicado' and not exists (
      select 1 from public.foto_producto
      where producto_id = old.producto_id and id <> old.id and publicada
    ) then
      raise exception 'datos_incompletos: conserva al menos una foto publicada';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger conservar_foto_publicada
before update or delete on public.foto_producto
for each row execute function public.conservar_foto_publicada();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.producto enable row level security;
alter table public.foto_producto enable row level security;

create policy producto_leer_publicado on public.producto
  for select to anon, authenticated
  using (estado = 'publicado');

create policy producto_leer_propio on public.producto
  for select to authenticated
  using (artesano_id = auth.uid());

-- Alta propia: solo en borrador y con las columnas de la IA en su valor inicial.
create policy producto_crear_propio on public.producto
  for insert to authenticated
  with check (
    artesano_id = auth.uid()
    and exists (select 1 from public.perfil where id = auth.uid() and rol = 'artesano')
    and estado = 'borrador'
    and revision_ia = 'sin_revisar'
    and ia_intentos = 0
    and comentario_precio_ia is null
    and ia_error is null
  );

create policy producto_actualizar_propio on public.producto
  for update to authenticated
  using (artesano_id = auth.uid())
  with check (artesano_id = auth.uid());

-- Fotos: el visitante ve las publicadas de productos publicados y la original
-- (para «Ver foto original», regla 3). El dueño ve y escribe las suyas.
create policy foto_leer_publica on public.foto_producto
  for select to anon, authenticated
  using (
    (publicada or origen = 'original')
    and exists (select 1 from public.producto p where p.id = producto_id and p.estado = 'publicado')
  );

create policy foto_leer_propia on public.foto_producto
  for select to authenticated
  using (exists (select 1 from public.producto p where p.id = producto_id and p.artesano_id = auth.uid()));

create policy foto_crear_propia on public.foto_producto
  for insert to authenticated
  with check (exists (select 1 from public.producto p where p.id = producto_id and p.artesano_id = auth.uid()));

create policy foto_actualizar_propia on public.foto_producto
  for update to authenticated
  using (exists (select 1 from public.producto p where p.id = producto_id and p.artesano_id = auth.uid()))
  with check (exists (select 1 from public.producto p where p.id = producto_id and p.artesano_id = auth.uid()));

-- La original nunca se borra: el dueño solo borra fotos de IA.
create policy foto_borrar_ia_propia on public.foto_producto
  for delete to authenticated
  using (
    origen = 'ia'
    and exists (select 1 from public.producto p where p.id = producto_id and p.artesano_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Storage (§Archivos): fotos públicas; audios solo del dueño.
-- Rutas: {artesano_id}/{producto_id}/original.jpg, ia-{variante}.png y descripcion.{ext}.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true), ('audios', 'audios', false)
on conflict (id) do nothing;

create policy fotos_leer on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'fotos');

create policy fotos_subir_propias on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Los reintentos de la original deben reutilizar el objeto existente, nunca
-- reemplazarlo. Solo las variantes de IA se pueden sobrescribir con upsert.
create policy fotos_reemplazar_propias on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
         and storage.filename(name) <> 'original.jpg')
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
              and storage.filename(name) <> 'original.jpg');

-- El archivo de la foto original nunca se borra.
create policy fotos_borrar_ia_propias on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and storage.filename(name) <> 'original.jpg'
  );

create policy audios_leer_propios on storage.objects
  for select to authenticated
  using (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy audios_subir_propios on storage.objects
  for insert to authenticated
  with check (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy audios_reemplazar_propios on storage.objects
  for update to authenticated
  using (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy audios_borrar_propios on storage.objects
  for delete to authenticated
  using (bucket_id = 'audios' and (storage.foldername(name))[1] = auth.uid()::text);
