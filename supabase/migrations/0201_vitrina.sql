-- PRP 004: proyección pública de productos y fotos, sin datos internos.
-- security_invoker conserva RLS de producto/foto; artesano_publico es la
-- proyección controlada del núcleo que oculta perfiles sin acreditación.
create view public.producto_publico
with (security_invoker = true, security_barrier = true)
as
select p.id, p.artesano_id, p.nombre, p.ficha,
       p.ficha ->> 'titulo' as titulo,
       p.ficha ->> 'tipo_producto' as tipo_producto,
       array(select jsonb_array_elements_text(p.ficha -> 'etiquetas')) as etiquetas,
       lower(translate(p.nombre, 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as nombre_normalizado,
       lower(translate(p.ficha ->> 'titulo', 'ÁÉÍÓÚÜÑáéíóúüñ', 'AEIOUUNaeiouun')) as titulo_normalizado,
       p.precio_final, p.disponibilidad, p.plazo_dias,
       a.nombre as artesano_nombre, a.lugar, a.asociacion
from public.producto p
join public.artesano_publico a on a.id = p.artesano_id
where p.estado = 'publicado';

create view public.foto_publica
with (security_invoker = true, security_barrier = true)
as
select f.id, f.producto_id, f.origen, f.variante, f.ruta, f.publicada, f.posicion
from public.foto_producto f
join public.producto_publico p on p.id = f.producto_id
where f.publicada or f.origen = 'original';

revoke all on public.producto_publico, public.foto_publica from public, anon, authenticated;
grant select on public.producto_publico, public.foto_publica to anon, authenticated;
