-- PRP 012 · Órdenes y mensajes (docs/contratos.md §orden, §mensaje_orden,
-- §Permisos, §Transiciones de orden). Las RPC de transición son del módulo C
-- (0301+): aquí no hay ninguna política de escritura sobre orden.

create type public.modalidad as enum ('recojo', 'envio');
create type public.estado_orden as enum (
  'solicitada', 'aceptada', 'rechazada', 'confirmada', 'pago_pendiente', 'pagada',
  'enviada', 'lista_para_recojo', 'entregada', 'cancelada'
);

-- §Datos de envío: { nombre_destinatario, telefono, departamento, provincia,
-- distrito, agencia_destino, referencia? }, todo texto y sin campos extra.
create function public.datos_envio_validos(datos jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(datos) = 'object'
     and datos - array['nombre_destinatario', 'telefono', 'departamento', 'provincia',
                       'distrito', 'agencia_destino', 'referencia'] = '{}'::jsonb
     and datos ?& array['nombre_destinatario', 'telefono', 'departamento', 'provincia',
                        'distrito', 'agencia_destino']
     and (select bool_and(jsonb_typeof(v) = 'string' and btrim(v #>> '{}') <> '')
          from jsonb_each(datos - 'referencia') as c(k, v))
     and (not datos ? 'referencia' or jsonb_typeof(datos -> 'referencia') = 'string');
$$;

create table public.orden (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.producto (id),
  -- El artesano no se guarda: se obtiene de producto.artesano_id (3FN, CC-09).
  comprador_id uuid not null references public.perfil (id),
  cantidad int not null check (cantidad >= 1),
  modalidad public.modalidad not null,
  datos_envio jsonb check (datos_envio is null or public.datos_envio_validos(datos_envio)),
  detalle text check (char_length(detalle) <= 1000),
  costo_envio numeric(10, 2) check (costo_envio >= 0),
  total numeric(10, 2) check (total > 0),
  fecha_entrega_estimada date,
  enlace_pago text check (enlace_pago ~ '^https://'),
  numero_guia text check (char_length(btrim(numero_guia)) between 1 and 60),
  estado public.estado_orden not null default 'solicitada',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint datos_envio_segun_modalidad check ((modalidad = 'envio') = (datos_envio is not null)),
  -- Desde aceptada, el acuerdo vive en campos (regla 12).
  constraint acuerdo_completo check (
    estado in ('solicitada', 'rechazada')
    or (total is not null and fecha_entrega_estimada is not null
        and (modalidad <> 'envio' or costo_envio is not null))
  ),
  constraint enlace_desde_pago_pendiente check (
    estado not in ('pago_pendiente', 'pagada', 'enviada', 'lista_para_recojo', 'entregada')
    or enlace_pago is not null
  ),
  constraint guia_al_enviar check (estado <> 'enviada' or numero_guia is not null)
);

create index orden_producto_idx on public.orden (producto_id);
create index orden_comprador_idx on public.orden (comprador_id);

create trigger orden_actualizado_en
before update on public.orden
for each row execute function public.tocar_actualizado_en();

create table public.mensaje_orden (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references public.orden (id) on delete cascade,
  autor_id uuid not null references public.perfil (id),
  texto_original text not null check (char_length(btrim(texto_original)) between 1 and 1000),
  -- { "<idioma>": "<texto>" } (CU-08, opcional). Lo escribe la Edge Function.
  texto_traducido jsonb check (texto_traducido is null or jsonb_typeof(texto_traducido) = 'object'),
  creado_en timestamptz not null default now()
);

create index mensaje_orden_orden_idx on public.mensaje_orden (orden_id, creado_en);

-- Partes de una orden: su comprador y el artesano del producto.
create function public.es_parte_de_orden(orden uuid)
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
    where o.id = orden and (o.comprador_id = auth.uid() or p.artesano_id = auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: cada parte lee sus órdenes y sus mensajes. Nadie actualiza orden
-- directamente: total, modalidad, destino y estado solo cambian por RPC.
-- ---------------------------------------------------------------------------
alter table public.orden enable row level security;
alter table public.mensaje_orden enable row level security;

create policy orden_leer_partes on public.orden
  for select to authenticated
  using (public.es_parte_de_orden(id));

create policy mensaje_leer_partes on public.mensaje_orden
  for select to authenticated
  using (public.es_parte_de_orden(orden_id));

create policy mensaje_escribir_partes on public.mensaje_orden
  for insert to authenticated
  with check (autor_id = auth.uid() and public.es_parte_de_orden(orden_id));

-- ---------------------------------------------------------------------------
-- Realtime (CC-09): el cliente se suscribe a la orden abierta; RLS filtra.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.orden, public.mensaje_orden;
