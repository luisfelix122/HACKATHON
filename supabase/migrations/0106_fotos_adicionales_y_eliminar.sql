-- CC-21 · Fotos adicionales del artesano y eliminación de productos.
-- La foto original sigue siendo única e inmutable (regla 3); las adicionales son
-- fotos propias del artesano, sin IA, que puede publicar, ordenar y quitar.

alter type public.origen_foto add value if not exists 'adicional';

-- Valores iniciales de una foto: ahora valida también la ruta y el tope de las adicionales.
create or replace function public.foto_valores_iniciales()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  carpeta text;
begin
  select p.artesano_id::text || '/' || p.id::text || '/' into carpeta
  from public.producto p where p.id = new.producto_id;

  if new.origen = 'original' and new.ruta is distinct from carpeta || 'original.jpg' then
    raise exception 'datos_incompletos: la foto original necesita su ruta canónica';
  end if;

  -- Una adicional vive en la carpeta del producto y nunca usa el nombre de la original.
  if new.origen::text = 'adicional' then
    if new.ruta not like carpeta || 'foto-%.jpg' then
      raise exception 'datos_incompletos: la foto adicional necesita una ruta foto-*.jpg del producto';
    end if;
    if (select count(*) from public.foto_producto f
        where f.producto_id = new.producto_id and f.origen::text = 'adicional') >= 8 then
      raise exception 'datos_incompletos: puedes agregar hasta 8 fotos propias por producto';
    end if;
  end if;

  if new.publicada is null then
    new.publicada := new.origen = 'original';
  end if;
  return new;
end;
$$;

-- El dueño borra cualquier foto que no sea la original (de IA o adicional).
drop policy if exists foto_borrar_ia_propia on public.foto_producto;
create policy foto_borrar_no_original_propia on public.foto_producto
  for delete to authenticated
  using (
    origen <> 'original'
    and exists (select 1 from public.producto p where p.id = producto_id and p.artesano_id = auth.uid())
  );

-- Elimina un producto propio. Si tiene pedidos, no se borra: se retira de la
-- vitrina para conservar el historial de esas órdenes.
create or replace function public.eliminar_producto(p_producto_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  pieza public.producto%rowtype;
begin
  select * into pieza from public.producto where id = p_producto_id for update;
  if not found or auth.uid() is null or pieza.artesano_id <> auth.uid() then
    raise exception 'no_autorizado: solo el artesano dueño puede eliminar este producto';
  end if;
  if pieza.estado = 'procesando' then
    raise exception 'transicion_invalida: espera a que la IA termine de procesar la pieza';
  end if;

  -- Retirar primero: así quitar sus fotos no choca con conservar_foto_publicada.
  if pieza.estado = 'publicado' then
    update public.producto set estado = 'retirado' where id = p_producto_id;
  end if;

  if exists (select 1 from public.orden where producto_id = p_producto_id) then
    return 'retirado';
  end if;

  delete from public.producto where id = p_producto_id;
  return 'eliminado';
end;
$$;

revoke all on function public.eliminar_producto(uuid) from public, anon;
grant execute on function public.eliminar_producto(uuid) to authenticated;

notify pgrst, 'reload schema';
