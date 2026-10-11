-- ====================================================================================
-- AYLLU · Datos semilla de la demo (muestra controlada, ficticia)
-- Archivo: supabase/seed.sql · Contrato: docs/contratos.md (CC-09) · PRP 004 y PRP 007
--
-- Reglas:
--   * Todos los nombres, RNA, correos y teléfonos son ficticios (regla 15).
--   * Los correos usan el dominio reservado .test: no existen ni reciben correo.
--   * Las cuentas de auth.users NO tienen contraseña conocida: no sirven para entrar.
--     Las cuentas de la demo (artesano, comprador y admin) se crean con login real
--     y el admin se asigna a mano por SQL (PRP 001), nunca aquí.
--   * Los WhatsApp +5190000000N son marcadores: reemplazarlos por el número del
--     equipo antes de la demo para que nadie escriba a un desconocido.
--   * Cada bloque solo corre si su tabla ya existe, para que `supabase db reset`
--     funcione en cualquier momento (todas las tablas vienen del PRP 012: perfil 0001,
--     producto y foto_producto 0002, orden y mensaje_orden 0003). Se puede aplicar dos veces sin duplicar.
--   * Cinco fotos de referencia por objeto: créditos visibles en ficha.descripcion y
--     detalle en supabase/seed/fotos/LICENCIAS.md. No son piezas de artesanos reales.
--   * Las fotos se suben aparte al bucket `fotos` en `{artesano_id}/{producto_id}/original.jpg`.
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- 0. Usuarios de Auth (requeridos por la clave foránea de perfil.id)
-- ------------------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
select u.id::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       u.email, '$2a$10$wT0XkO0PjZ8j2t2L9z0q.eGqf6kM7N4V1qXoH1kG3qJ7j1k2l3m4n', now(),
       '', '', '', '',
       '{"provider":"email","providers":["email"]}', jsonb_build_object('nombre', u.nombre), now(), now()
from (values
  ('00000000-0000-0000-0000-000000000001', 'maria.juarez@ayllu.test',    'María Juárez'),
  ('00000000-0000-0000-0000-000000000002', 'carmen.silva@ayllu.test',    'Carmen Silva'),
  ('00000000-0000-0000-0000-000000000003', 'rosa.paiva@ayllu.test',      'Rosa Paiva'),
  ('00000000-0000-0000-0000-000000000004', 'jose.ruiz@ayllu.test',       'José Ruiz'),
  ('00000000-0000-0000-0000-000000000005', 'ana.tavara@ayllu.test',      'Ana Távara'),
  ('00000000-0000-0000-0000-000000000006', 'lucia.pazo@ayllu.test',      'Lucía Pazo'),
  ('00000000-0000-0000-0000-000000000007', 'carlos.mendoza@ayllu.test',  'Carlos Mendoza'),
  ('00000000-0000-0000-0000-000000000008', 'pedro.chulle@ayllu.test',    'Pedro Chulle'),
  ('00000000-0000-0000-0000-000000000009', 'rosaura.vilchez@ayllu.test', 'Rosaura Vílchez'),
  ('00000000-0000-0000-0000-000000000090', 'camila.turista@ayllu.test',  'Compradora Demo')
) as u(id, email, nombre)
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------------
-- 1. Perfiles
-- ------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.perfil') is null then return; end if;

  insert into public.perfil (id, rol, nombre, whatsapp, lugar, asociacion, historia, rna_numero, acreditacion, acreditacion_nota) values
  -- Asociación de Mujeres Tejedoras de Los Órganos (textil y fibras)
  ('00000000-0000-0000-0000-000000000001', 'artesano', 'María Juárez', '+51900000001', 'Los Órganos', 'Asociación de Mujeres Tejedoras de Los Órganos',
   'Tejedora desde los 15 años; aprendí el crochet de mi abuela. Busco llevar los colores del atardecer norteño a mis prendas.', 'RNA-1001', 'aprobada', null),
  ('00000000-0000-0000-0000-000000000002', 'artesano', 'Carmen Silva', '+51900000002', 'Los Órganos', 'Asociación de Mujeres Tejedoras de Los Órganos',
   'Especialista en macramé. Mis piezas se inspiran en las redes de los pescadores artesanales de mi caleta.', 'RNA-1002', 'aprobada', null),
  ('00000000-0000-0000-0000-000000000003', 'artesano', 'Rosa Paiva', '+51900000003', 'Los Órganos', 'Asociación de Mujeres Tejedoras de Los Órganos',
   'Trabajo la paja toquilla adaptando las técnicas tradicionales a la moda de playa. Cada sombrero cuenta una historia de paciencia.', 'RNA-1003', 'aprobada', null),
  -- Gremio de Artesanos de Cabo Blanco (bisutería marina y tallado)
  ('00000000-0000-0000-0000-000000000004', 'artesano', 'José Ruiz', '+51900000004', 'Cabo Blanco', 'Gremio de Artesanos de Cabo Blanco',
   'Hijo y nieto de pescadores. Cuando no estoy en el mar, tallo en madera balsa las chalanas que nos dan sustento.', 'RNA-2001', 'aprobada', null),
  ('00000000-0000-0000-0000-000000000005', 'artesano', 'Ana Távara', '+51900000005', 'Cabo Blanco', 'Gremio de Artesanos de Cabo Blanco',
   'Engasto a mano en plata las perlas que nos regala el mar de Cabo Blanco para crear piezas únicas.', 'RNA-2002', 'aprobada', null),
  ('00000000-0000-0000-0000-000000000006', 'artesano', 'Lucía Pazo', '+51900000006', 'Cabo Blanco', 'Gremio de Artesanos de Cabo Blanco',
   'Transformo la concha Spondylus de nuestros ancestros tallanes en joyería contemporánea.', 'RNA-2003', 'aprobada', null),
  -- Independiente (cuero de pescado, Lobitos)
  ('00000000-0000-0000-0000-000000000007', 'artesano', 'Carlos Mendoza', '+51900000007', 'Lobitos', null,
   'Convierto las pieles de descarte de la pesca del perico en cuero resistente, desde mi taller frente a las olas de Lobitos.', 'RNA-3001', 'aprobada', null),
  -- Casos para el panel de administración
  ('00000000-0000-0000-0000-000000000008', 'artesano', 'Pedro Chulle', '+51900000008', 'Máncora', 'Artesanos de la Playa',
   'Tallador de madera balsa que solicita unirse a la plataforma.', 'RNA-4001', 'pendiente', null),
  ('00000000-0000-0000-0000-000000000009', 'artesano', 'Rosaura Vílchez', '+51900000009', 'Lobitos', null,
   'Tejedora en telar.', 'RNA-4002', 'rechazada', 'El número de RNA declarado no se pudo verificar. Revísalo y vuelve a enviarlo.')
  on conflict (id) do nothing;

  -- Comprador de prueba (sin datos de artesano; la acreditación queda con su valor por defecto)
  insert into public.perfil (id, rol, nombre)
  values ('00000000-0000-0000-0000-000000000090', 'comprador', 'Compradora Demo')
  on conflict (id) do nothing;
end $$;

-- ------------------------------------------------------------------------------------
-- 2. Productos: 21 publicados, 1 retirado (no debe verse) y 1 borrador (APK)
-- Sin precio sugerido ni cantidad en stock (3FN y CC-09).
-- ------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.producto') is null then return; end if;

  insert into public.producto (id, artesano_id, estado, nombre, descripcion_texto, ficha, costeo, precio_final, disponibilidad, plazo_dias, revision_ia, ia_intentos) values
  -- María Juárez · crochet
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'publicado', 'Top de bikini atardecer', 'Top de bikini tejido a crochet color naranja.',
   '{"titulo": "Top de bikini Atardecer tejido a crochet", "descripcion": "Top de bikini ligero y resistente, tejido a mano en algodón pima. Ideal para el verano norteño. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["hilo de algodón pima"], "tecnica": "tejido a crochet", "tipo_producto": "textil", "historia_pieza": "Inspirado en los atardeceres anaranjados de Los Órganos.", "etiquetas": ["crochet", "playa", "algodón pima"]}',
   '{"materiales": 15.00, "horas": 3, "pago_hora": 8.00, "gastos": 2.00, "ganancia": 20.00}', 60.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'publicado', 'Falda playera calada', 'Falda blanca de playa tejida.',
   '{"titulo": "Falda larga calada para la playa", "descripcion": "Falda larga con diseño calado que deja sentir la brisa del mar. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["hilo de algodón"], "tecnica": "tejido a crochet", "tipo_producto": "textil", "historia_pieza": "Diseño clásico para caminar por la orilla.", "etiquetas": ["crochet", "playa", "hecho a pedido"]}',
   '{"materiales": 25.00, "horas": 6, "pago_hora": 8.00, "gastos": 5.00, "ganancia": 30.00}', 110.00, 'a_pedido', 4, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'publicado', 'Sombrero de crochet', 'Sombrero tejido para el sol.',
   '{"titulo": "Sombrero flexible de crochet", "descripcion": "Sombrero de ala corta tejido firme para proteger del sol sin perder frescura. Demo ficticia. Foto de referencia del mismo tipo de objeto, no de este artesano: dani0010 (CC BY-SA 2.0; https://creativecommons.org/licenses/by-sa/2.0/). Fuente: https://www.flickr.com/photos/21609187@N00/3451315456. Reducida a JPEG. Materiales y origen de la pieza de demo no acreditados por la foto.", "materiales": ["hilo de algodón grueso"], "tecnica": "tejido a crochet", "tipo_producto": "textil", "historia_pieza": "Un accesorio infaltable en el norte.", "etiquetas": ["crochet", "sombrero", "sol"]}',
   '{"materiales": 12.00, "horas": 2, "pago_hora": 8.00, "gastos": 2.00, "ganancia": 15.00}', 45.00, 'en_stock', null, 'aprobada', 1),
  -- Carmen Silva · macramé
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'publicado', 'Bolso red de pescador', 'Bolso de macramé tipo red.',
   '{"titulo": "Bolso de macramé Red de Pescador", "descripcion": "Bolso expansible tejido en nudos, perfecto para la toalla y el protector solar. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["cuerda de algodón"], "tecnica": "macramé", "tipo_producto": "textil", "historia_pieza": "Imita la forma y la resistencia de las redes de pesca artesanal.", "etiquetas": ["macramé", "bolso", "pesca artesanal"]}',
   '{"materiales": 18.00, "horas": 4, "pago_hora": 8.00, "gastos": 3.00, "ganancia": 25.00}', 80.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'publicado', 'Porta botella macramé', 'Para llevar agua, tejido con cuerda.',
   '{"titulo": "Porta botella cruzado de macramé", "descripcion": "Funda colgante para llevar botellas o tomatodos cruzada al hombro. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["cuerda de algodón trenzado"], "tecnica": "macramé", "tipo_producto": "utilitario", "historia_pieza": "Creado para tener las manos libres en las caminatas por la costa.", "etiquetas": ["macramé", "caminata"]}',
   '{"materiales": 8.00, "horas": 1, "pago_hora": 8.00, "gastos": 1.00, "ganancia": 15.00}', 30.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'publicado', 'Tapiz mural olas', 'Adorno de pared tejido.',
   '{"titulo": "Tapiz de macramé Olas", "descripcion": "Decoración de pared tejida a mano con patrones ondulados sobre una rama de deriva. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["cuerda de algodón", "rama de deriva"], "tecnica": "macramé", "tipo_producto": "textil", "historia_pieza": "Cada nudo representa la constancia de las olas en la orilla.", "etiquetas": ["macramé", "decoración", "hecho a pedido"]}',
   '{"materiales": 30.00, "horas": 8, "pago_hora": 8.00, "gastos": 5.00, "ganancia": 60.00}', 150.00, 'a_pedido', 5, 'aprobada', 1),
  -- Rosa Paiva · paja toquilla
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'publicado', 'Sombrero chalán fino', 'Sombrero de paja toquilla.',
   '{"titulo": "Sombrero chalán de paja toquilla fina", "descripcion": "Sombrero de ala ancha y tejido muy fino, con máxima protección solar. Demo ficticia. Foto de referencia del mismo tipo de objeto, no de este artesano: Hex (CC BY-SA 3.0; https://creativecommons.org/licenses/by-sa/3.0). Fuente: https://commons.wikimedia.org/wiki/File:Panama_hat.jpg. Reducida a JPEG. Materiales y origen de la pieza de demo no acreditados por la foto.", "materiales": ["paja toquilla"], "tecnica": "tejido a mano", "tipo_producto": "textil", "historia_pieza": "Un clásico de la identidad piurana.", "etiquetas": ["paja toquilla", "sombrero", "sol"]}',
   '{"materiales": 40.00, "horas": 15, "pago_hora": 6.00, "gastos": 5.00, "ganancia": 50.00}', 180.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'publicado', 'Cartera de toquilla', 'Bolso tejido de paja.',
   '{"titulo": "Cartera de mano de paja toquilla", "descripcion": "Cartera estructurada de fibras naturales con detalles de cuero, ideal para tardes de verano. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["paja toquilla", "cuero"], "tecnica": "tejido a mano", "tipo_producto": "textil", "historia_pieza": "Tejida en las tardes frescas, cuando la humedad evita que la paja se quiebre.", "etiquetas": ["paja toquilla", "cartera", "hecho a pedido"]}',
   '{"materiales": 20.00, "horas": 8, "pago_hora": 6.00, "gastos": 4.00, "ganancia": 40.00}', 110.00, 'a_pedido', 3, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'publicado', 'Abanico frescor', 'Abanico de paja.',
   '{"titulo": "Abanico de paja toquilla Frescor", "descripcion": "Abanico de mano ligero y resistente, teñido con colores naturales. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["paja toquilla"], "tecnica": "tejido a mano", "tipo_producto": "utilitario", "historia_pieza": "Accesorio tradicional para el intenso calor del norte peruano.", "etiquetas": ["paja toquilla", "tintes naturales"]}',
   '{"materiales": 5.00, "horas": 2, "pago_hora": 6.00, "gastos": 1.00, "ganancia": 15.00}', 30.00, 'en_stock', null, 'aprobada', 1),
  -- José Ruiz · tallado
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000004', 'publicado', 'Chalana a escala', 'Bote de pesca tallado en madera.',
   '{"titulo": "Chalana de Cabo Blanco a escala", "descripcion": "Réplica a escala de las chalanas pesqueras a vela de Cabo Blanco. Referencia visual parcial de una jangada brasileña; no representa una chalana de Cabo Blanco. Demo ficticia. Foto de referencia del mismo tipo de objeto, no de este artesano: roger4336 (CC BY-SA 2.0; https://creativecommons.org/licenses/by-sa/2.0/). Fuente: https://www.flickr.com/photos/24736216@N07/10445430445. Reducida a JPEG. Materiales y origen de la pieza de demo no acreditados por la foto.", "materiales": ["madera balsa", "tela de algodón"], "tecnica": "talla en madera y ensamblado", "tipo_producto": "tallado", "historia_pieza": "Homenaje a la pesca artesanal a vela de la caleta.", "etiquetas": ["madera balsa", "pesca artesanal", "decoración"]}',
   '{"materiales": 20.00, "horas": 10, "pago_hora": 10.00, "gastos": 5.00, "ganancia": 50.00}', 180.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000004', 'publicado', 'Llavero pez espada', 'Llavero tallado de merlín.',
   '{"titulo": "Llavero tallado Pez Espada", "descripcion": "Llavero detallado en forma de merlín, ícono de la zona. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["madera de zapote", "argolla de metal"], "tecnica": "talla a mano", "tipo_producto": "tallado", "historia_pieza": "Cabo Blanco es famoso por la pesca deportiva del merlín negro.", "etiquetas": ["madera", "recuerdo"]}',
   '{"materiales": 2.00, "horas": 1, "pago_hora": 10.00, "gastos": 1.00, "ganancia": 12.00}', 25.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000004', 'publicado', 'Balsa miniatura', 'Adorno de balsita.',
   '{"titulo": "Balsa miniatura atada a mano", "descripcion": "Adorno rústico que representa una balsa atada de forma artesanal. Demo ficticia. Foto de referencia del mismo tipo de objeto, no de este artesano: Autor desconocido (Public domain; https://commons.wikimedia.org/wiki/File:Bolivia,_Mosetenes_raft,_model_in_the_Vatican_Museums.jpg). Fuente: https://commons.wikimedia.org/wiki/File:Bolivia,_Mosetenes_raft,_model_in_the_Vatican_Museums.jpg. Reducida a JPEG. Materiales y origen de la pieza de demo no acreditados por la foto.", "materiales": ["madera balsa", "hilo de cáñamo"], "tecnica": "ensamblado", "tipo_producto": "otro", "historia_pieza": "Recuerda a los antiguos navegantes de nuestras costas.", "etiquetas": ["madera balsa", "decoración"]}',
   '{"materiales": 5.00, "horas": 2, "pago_hora": 10.00, "gastos": 2.00, "ganancia": 20.00}', 45.00, 'en_stock', null, 'aprobada', 1),
  -- Ana Távara · perlas y plata
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000005', 'publicado', 'Aretes de perla', 'Aretes de perla de Cabo Blanco.',
   '{"titulo": "Aretes de perla cultivada en plata", "descripcion": "Aretes con perlas cultivadas en aguas locales, engastadas a mano en plata. Demo ficticia. Foto de referencia del mismo tipo de objeto, no de este artesano: NATALIA PHOTOS (CC BY-SA 2.0; https://creativecommons.org/licenses/by-sa/2.0/). Fuente: https://www.flickr.com/photos/71099398@N00/2208368349. Reducida a JPEG. Materiales y origen de la pieza de demo no acreditados por la foto.", "materiales": ["perla cultivada", "plata 950"], "tecnica": "orfebrería", "tipo_producto": "bisutería marina", "historia_pieza": "Las perlas de Cabo Blanco son un tesoro de nuestro mar tropical.", "etiquetas": ["perla", "plata", "joyería"]}',
   '{"materiales": 50.00, "horas": 3, "pago_hora": 15.00, "gastos": 10.00, "ganancia": 60.00}', 160.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000005', 'publicado', 'Collar gota de mar', 'Collar con perla en forma de gota.',
   '{"titulo": "Collar Gota de Mar con perla", "descripcion": "Collar con cadena de plata y un dije de perla de forma irregular. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["perla cultivada", "cadena de plata 925"], "tecnica": "ensamblado de joyería", "tipo_producto": "bisutería marina", "historia_pieza": "Elegimos las perlas con formas más parecidas a gotas de agua.", "etiquetas": ["perla", "plata", "hecho a pedido"]}',
   '{"materiales": 60.00, "horas": 2, "pago_hora": 15.00, "gastos": 10.00, "ganancia": 70.00}', 180.00, 'a_pedido', 5, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000005', 'publicado', 'Pulsera tres perlas', 'Pulsera de hilo con perlas.',
   '{"titulo": "Pulsera de macramé Tres Perlas", "descripcion": "Pulsera minimalista de macramé fino con tres perlas cultivadas al centro. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["hilo encerado", "perla cultivada"], "tecnica": "macramé", "tipo_producto": "bisutería marina", "historia_pieza": "Las tres perlas simbolizan el pasado, el presente y el futuro de nuestra tradición marina.", "etiquetas": ["perla", "macramé", "pulsera"]}',
   '{"materiales": 25.00, "horas": 2, "pago_hora": 10.00, "gastos": 5.00, "ganancia": 40.00}', 85.00, 'en_stock', null, 'aprobada', 1),
  -- Lucía Pazo · Spondylus
  ('10000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000006', 'publicado', 'Collar oro rojo', 'Collar de concha roja pulida.',
   '{"titulo": "Collar Oro Rojo de Spondylus", "descripcion": "Collar con una pieza central pulida de Spondylus engastada en alpaca. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["concha Spondylus", "alpaca"], "tecnica": "pulido y engaste", "tipo_producto": "bisutería marina", "historia_pieza": "El Spondylus fue la concha más valiosa para las culturas antiguas de nuestra costa.", "etiquetas": ["spondylus", "joyería", "tallán"]}',
   '{"materiales": 30.00, "horas": 5, "pago_hora": 12.00, "gastos": 5.00, "ganancia": 60.00}', 160.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000006', 'publicado', 'Aretes sol tallán', 'Aretes circulares de spondylus.',
   '{"titulo": "Aretes Sol Tallán de Spondylus", "descripcion": "Aretes circulares tallados en la parte más intensa de la concha Spondylus. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["concha Spondylus", "plata 925"], "tecnica": "tallado y pulido", "tipo_producto": "bisutería marina", "historia_pieza": "La forma circular recuerda al sol de las culturas prehispánicas.", "etiquetas": ["spondylus", "plata", "hecho a pedido"]}',
   '{"materiales": 25.00, "horas": 4, "pago_hora": 12.00, "gastos": 5.00, "ganancia": 50.00}', 130.00, 'a_pedido', 5, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000006', 'publicado', 'Pulsera de chispas', 'Pulsera con fragmentos morados de concha.',
   '{"titulo": "Pulsera de chispas de Spondylus morado", "descripcion": "Pulsera con pequeños fragmentos pulidos de Spondylus morado. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["concha Spondylus", "hilo de nylon"], "tecnica": "ensamblado", "tipo_producto": "bisutería marina", "historia_pieza": "La variedad morada vive en aguas más profundas y es más difícil de recolectar.", "etiquetas": ["spondylus", "pulsera"]}',
   '{"materiales": 15.00, "horas": 2, "pago_hora": 12.00, "gastos": 3.00, "ganancia": 30.00}', 75.00, 'en_stock', null, 'aprobada', 1),
  -- Carlos Mendoza · cuero de pescado
  ('10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000007', 'publicado', 'Billetera de cuero de perico', 'Billetera hecha con cuero de pescado perico.',
   '{"titulo": "Billetera de cuero de pescado perico", "descripcion": "Billetera resistente elaborada con piel curtida de perico e interior de tela reciclada. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["cuero de pescado", "tela reciclada"], "tecnica": "curtiembre y marroquinería", "tipo_producto": "utilitario", "historia_pieza": "Aprovechamos los residuos de la pesca del día en Lobitos.", "etiquetas": ["cuero de pescado", "reciclado", "lobitos"]}',
   '{"materiales": 30.00, "horas": 6, "pago_hora": 10.00, "gastos": 5.00, "ganancia": 50.00}', 150.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000007', 'publicado', 'Llavero quilla de surf', 'Llavero en forma de quilla forrado en cuero.',
   '{"titulo": "Llavero Quilla de Surf en cuero de pescado", "descripcion": "Llavero inspirado en el surf, forrado a mano con cuero de pescado curtido. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["cuero de pescado", "madera balsa", "argolla de acero"], "tecnica": "ensamblado y forrado", "tipo_producto": "utilitario", "historia_pieza": "Homenaje a las olas de Lobitos, paraíso del surf.", "etiquetas": ["surf", "cuero de pescado", "lobitos"]}',
   '{"materiales": 5.00, "horas": 1, "pago_hora": 10.00, "gastos": 2.00, "ganancia": 15.00}', 30.00, 'en_stock', null, 'aprobada', 1),
  ('10000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000007', 'publicado', 'Tarjetero marino', 'Tarjetero pequeño de cuero oscuro.',
   '{"titulo": "Tarjetero Marino de cuero de pescado", "descripcion": "Tarjetero minimalista con la textura natural de las escamas curtidas. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["cuero de pescado"], "tecnica": "marroquinería artesanal", "tipo_producto": "utilitario", "historia_pieza": "Pensado para quienes visitan el norte con poco equipaje.", "etiquetas": ["cuero de pescado", "lobitos", "hecho a pedido"]}',
   '{"materiales": 15.00, "horas": 3, "pago_hora": 10.00, "gastos": 3.00, "ganancia": 35.00}', 85.00, 'a_pedido', 5, 'aprobada', 1),
  -- Caso borde: pieza agotada → el artesano la retira; no debe aparecer en la vitrina (CC-09)
  ('10000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'retirado', 'Top edición especial', 'Pieza única de fin de temporada.',
   '{"titulo": "Top edición especial", "descripcion": "Pieza única de fin de temporada. Demo ficticia. Foto correspondiente pendiente; no se utiliza una imagen de otro objeto.", "materiales": ["hilo de algodón"], "tecnica": "tejido a crochet", "tipo_producto": "textil", "historia_pieza": "Se vendió en la feria y se retiró de la vitrina.", "etiquetas": ["crochet"]}',
   '{"materiales": 15.00, "horas": 3, "pago_hora": 8.00, "gastos": 2.00, "ganancia": 20.00}', 60.00, 'en_stock', null, 'aprobada', 1),
  -- Caso borde: borrador sincronizado, aún sin IA (APK de Carlos)
  ('10000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000007', 'borrador', 'Billetera en creación', 'Billetera de cuero de perico con costura doble, color natural.',
   null, null, null, null, null, 'sin_revisar', 0)
  on conflict (id) do nothing;
end $$;

-- ------------------------------------------------------------------------------------
-- 3. Fotos: una original publicada por producto (las variantes de IA las crea el PRP 003)
-- ------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.foto_producto') is null then return; end if;

  insert into public.foto_producto (id, producto_id, origen, variante, ruta, publicada, posicion)
  select ('30000000-0000-0000-0000-0000000000' || right(p.id::text, 2))::uuid,
         p.id, 'original', null,
         p.artesano_id || '/' || p.id || '/original.jpg',
         true, 0
  from public.producto p
  where p.id::text like '10000000-0000-0000-0000-0000000000%'
  on conflict (id) do nothing;
end $$;

-- ------------------------------------------------------------------------------------
-- 4. Órdenes de ejemplo (PRP 005 y 006): una esperando el abono y otra ya enviada
-- ------------------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.orden') is null then return; end if;

  insert into public.orden (id, producto_id, comprador_id, cantidad, modalidad, datos_envio, detalle, costo_envio, total, fecha_entrega_estimada, enlace_pago, numero_guia, estado) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000090',
   1, 'envio',
   '{"nombre_destinatario": "Compradora Demo", "telefono": "+51900000090", "departamento": "Lima", "provincia": "Lima", "distrito": "Miraflores", "agencia_destino": "Shalom Miraflores"}',
   'Talla M, color naranja atardecer', 15.00, 75.00, current_date + 3,
   'https://pago.ejemplo.test/ayllu-demo', null, 'pago_pendiente'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000090',
   1, 'envio',
   '{"nombre_destinatario": "Compradora Demo", "telefono": "+51900000090", "departamento": "Arequipa", "provincia": "Arequipa", "distrito": "Yanahuara", "agencia_destino": "Shalom Arequipa"}',
   null, 20.00, 170.00, current_date + 5,
   'https://pago.ejemplo.test/ayllu-demo-2', 'GUIA-DEMO-0001', 'enviada')
  on conflict (id) do nothing;
end $$;

do $$
begin
  if to_regclass('public.mensaje_orden') is null then return; end if;

  insert into public.mensaje_orden (id, orden_id, autor_id, texto_original) values
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000090',
   'Hola, ¿la puede hacer en talla M? Es para un regalo.'),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
   'Sí, claro. Ya tengo el hilo naranja. Le envié el enlace de pago.')
  on conflict (id) do nothing;
end $$;
