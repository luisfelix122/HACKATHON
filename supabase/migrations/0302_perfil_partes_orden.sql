-- Módulo C · PRP 005 (CU-05): Permitir a las partes de una orden consultar el perfil
-- de la otra parte (nombre y contacto) para coordinar el pedido y el despacho.

create policy perfil_leer_partes_orden on public.perfil
  for select to authenticated
  using (
    exists (
      select 1
      from public.orden o
      join public.producto p on p.id = o.producto_id
      where (o.comprador_id = perfil.id and p.artesano_id = auth.uid())
         or (p.artesano_id = perfil.id and o.comprador_id = auth.uid())
    )
  );
