-- CU-03 · Trigger para validar transiciones de estado del producto y rechazo de IA (docs/contratos.md, docs/dominio.md §Estados).

create or replace function public.transicion_producto_valida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Si el estado no cambia, permitir
  if new.estado = old.estado then
    return new;
  end if;

  -- Regla: un producto rechazado por la IA no puede publicarse jamás
  if new.estado = 'publicado' and (new.revision_ia = 'rechazada' or old.revision_ia = 'rechazada') then
    raise exception 'no_autorizado: no se puede publicar un producto rechazado por la IA';
  end if;

  -- Transiciones válidas del ciclo de vida del producto:
  -- borrador   -> procesando, en_revision, publicado
  -- procesando -> en_revision, borrador
  -- en_revision -> procesando, publicado, borrador
  -- publicado  -> retirado
  -- retirado   -> publicado, en_revision

  if old.estado = 'borrador' and new.estado in ('procesando', 'en_revision', 'publicado') then
    return new;
  end if;

  if old.estado = 'procesando' and new.estado in ('en_revision', 'borrador') then
    return new;
  end if;

  if old.estado = 'en_revision' and new.estado in ('procesando', 'publicado', 'borrador') then
    return new;
  end if;

  if old.estado = 'publicado' and new.estado in ('retirado') then
    return new;
  end if;

  if old.estado = 'retirado' and new.estado in ('publicado', 'en_revision') then
    return new;
  end if;

  raise exception 'transicion_invalida: no se puede pasar el producto de % a %', old.estado, new.estado;
end;
$$;

drop trigger if exists transicion_producto_valida on public.producto;

create trigger transicion_producto_valida
before update of estado on public.producto
for each row execute function public.transicion_producto_valida();
