# Notificaciones

`CampanaNotificaciones` recibe `usuarioId` de la sesión autenticada y funciona en web y APK. Usa la publicación Realtime existente de `orden` y `mensaje_orden`; sus políticas RLS limitan la lectura a las partes del pedido. El componente limpia suscripciones al cerrar sesión o cambiar de usuario.

El contador muestra únicamente eventos recibidos en esta sesión. No representa un historial persistente ni mensajes anteriores sin leer. Cada enlace abre el pedido y marca la novedad como leída. Tras perder conexión puede haber eventos no recibidos; el panel ofrece acceso a todos los pedidos para consultar su estado actual.

## Push Android pendiente

En este checkout no existe `android/app/google-services.json`, no hay dependencia `@capacitor/push-notifications` y no existe registro de tokens ni envío FCM implementados. El bloque condicional de Gradle por sí solo no proporciona push.

Para recibir mensajes con la app cerrada hace falta:

1. Un proyecto Firebase del equipo y una aplicación Android registrada con el applicationId `pe.ayllu.artesano`, entregando su `google-services.json` por un canal autorizado.
2. Integrar el plugin Capacitor, solicitar permiso de notificaciones en Android compatible y registrar/renovar el token del dispositivo al autenticar; eliminarlo al cerrar sesión.
3. Una tabla de dispositivos con RLS para que cada usuario gestione solo sus tokens y un emisor de backend autenticado que envíe por FCM HTTP v1 al cambiar pedidos o insertar mensajes. La credencial de servicio debe permanecer exclusivamente en el servidor.
4. Compilar e instalar la APK solo cuando el usuario lo pida y comprobar recepción con la app cerrada y en primer plano.

No se agregaron dependencias nativas ni credenciales. Las notificaciones actuales requieren la app abierta y conectividad; no se promete entrega offline.
