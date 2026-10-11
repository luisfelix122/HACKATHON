-- CU-01: solo el administrador resuelve la acreditación mediante esta RPC.
create function public.resolver_acreditacion(artesano uuid, resultado public.acreditacion, nota text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then raise exception 'no_autorizado'; end if;
  if resultado is null or resultado not in ('aprobada', 'rechazada')
    or (resultado = 'rechazada' and nullif(btrim(nota), '') is null)
    or char_length(nota) > 300 then
    raise exception 'datos_incompletos';
  end if;
  update public.perfil
  set acreditacion = resultado,
      acreditacion_nota = case when resultado = 'rechazada' then btrim(nota) else null end
  where id = artesano and rol = 'artesano';
  if not found then raise exception 'datos_incompletos'; end if;
end;
$$;
revoke all on function public.resolver_acreditacion(uuid, public.acreditacion, text) from public, anon;
grant execute on function public.resolver_acreditacion(uuid, public.acreditacion, text) to authenticated;
