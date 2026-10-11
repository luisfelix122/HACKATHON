# Correcciones locales CU14

Cambios en el worktree cu-14/integracion-final. No se desplegaron al servidor ni se generó otra APK. Las pantallas compartidas afectan web y código Android; el APK instalado conservará la versión anterior hasta una compilación solicitada.

## Cambios

- Términos sin aviso de demostración, durante registro normal; nombre del perfil en cuenta y web.
- Bandeja con nombres de contraparte/producto, fecha y hora de Lima, búsqueda y filtros. Distingue cantidad total de pedidos y pedidos en curso.
- Chat según documento de traspaso: datos y conversación, paneles móviles, burbujas propias, chips y confirmaciones por RPC. Traducción automática conserva original y permite reintentar.
- Actualizar producto publicado con guardado atómico de ficha y fotos.
- Campana de eventos Realtime de esta sesión. Push Android aún requiere Firebase, plugin y emisor servidor; ver [requisitos](../../src/compartido/notificaciones/README.md).
- Ubigeo de BD dependiente y DNI obligatorio para nuevos envíos. Errores de catálogo ausente distinguidos de red.

## SQL para el operador

Sobre el esquema Ayllu existente, abrir cada archivo y copiarlo completo al SQL Editor:

1. [Ubicaciones y DNI](actualizacion-dni-ubicaciones.sql): instala 0303. Ejecutar solo si esa migración no fue aplicada. Tiene transacción; no elimina pedidos históricos.
2. [Nombres y actualización de producto](actualizacion-pedidos-publicacion.sql): instala RPC 0105 y0304. Las cuentas ajenas no acceden a nombres de partes.
3. [Restaurar transiciones](restaurar-funciones-pedidos.sql): usar solo si faltan las RPC CU06 o sus definiciones no coinciden con el repositorio. No cambia perfiles ni asigna roles.

Diagnóstico previo sin datos personales:

~~~sql
select to_regclass('public.departamento') departamento,
       to_regclass('public.provincia') provincia,
       to_regclass('public.distrito') distrito;
select to_regprocedure('public.aceptar_orden(uuid,numeric,numeric,date)') aceptar,
       to_regprocedure('public.rechazar_orden(uuid,text)') rechazar,
       to_regprocedure('public.listar_pedidos()') listado,
       to_regprocedure('public.detalle_pedido(uuid)') detalle;
select schemaname, tablename from pg_publication_tables
where pubname='supabase_realtime' and tablename in ('orden','mensaje_orden');
~~~

Después del SQL, probar pedidos reales como comprador y artesano: nombres, hora, aceptar/rechazar, mensajes y permisos. El mensaje genérico anterior no demuestra un problema de red: puede ser RPC faltante, permisos, estado o identidad. Sin acceso autorizado al servidor no se confirmó su causa allí. La UI ahora identifica funciones faltantes/permisos/estado; las comprobaciones locales no sustituyen esta prueba.

## Cuentas y conectividad

Roles actuales de BD: comprador, artesano y admin. Turista corresponde a comprador. Registro desde APK crea artesano y desde web crea comprador si no existe perfil; un perfil existente mantiene rol. Google y contraseña son métodos soportados, no hay conversión automática Google→usuario/contraseña. Login nuevo y vincular contraseña requieren conexión. Sin internet el artesano puede continuar con sesión previamente guardada y datos locales; no autenticar una cuenta nueva usando contraseña.

## IA

Ver [conectar y probar LiteLLM](conectar-ia-servidor.md). La captura enumera preparación; no acredita despliegue ni inferencias exitosas. Pendientes operador: claves privadas, contenedores/red, variables functions, bundles, reinicio y pruebas texto/audio/imagen/traducción/autenticación. No guardar claves en VITE ni en Git.
