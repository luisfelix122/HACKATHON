#!/bin/sh
# Respaldo de Postgres; Storage necesita además una copia de sus archivos.
set -eu
umask 077

proyecto=/datos/trabajo/proyectos/ayllu
destino="$proyecto/respaldos"
compose="$proyecto/supabase/docker"

mkdir -p "$destino"
destino_real=$(cd "$destino" && pwd -P)
if [ "$destino_real" != "$destino" ]; then
  printf '%s\n' 'La ruta de respaldos debe ser la ruta física acordada.' >&2
  exit 1
fi
cd "$compose"
fecha=$(date -u +%Y%m%dT%H%M%SZ)
temporal=$(mktemp "$destino/.postgres-$fecha-XXXXXX")
trap 'rm -f -- "$temporal"' EXIT HUP INT TERM

docker compose exec -T db sh -ec \
  'export PGPASSWORD="$POSTGRES_PASSWORD"; exec pg_dump -U supabase_admin -d postgres -Fc' > "$temporal"
test -s "$temporal"
# Solo se publica y rota después de verificar que el archivo es legible.
docker compose exec -T db pg_restore --list < "$temporal" > /dev/null
final="$destino/postgres-$fecha.dump"
if [ -e "$final" ]; then
  printf '%s\n' 'Ya existe un respaldo de este segundo; vuelve a intentarlo.' >&2
  exit 1
fi
mv -- "$temporal" "$final"

# Retener 7 días. El glob limita la rotación a nuestros dumps, sin recorrer carpetas.
limite=$(($(date -u +%s) - 7 * 24 * 60 * 60))
for archivo in "$destino"/postgres-*.dump; do
  [ -f "$archivo" ] || continue
  [ -L "$archivo" ] && continue
  modificado=$(date -r "$archivo" +%s)
  if [ "$modificado" -lt "$limite" ]; then
    rm -- "$archivo"
  fi
done
printf 'Respaldo de Postgres creado: %s\n' "$final"
