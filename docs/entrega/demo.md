# Guion de demo — versión <X.Y.Z>

- Duración del pitch: **3:00 exactos** (la demo en vivo ocupa ≈ 2:00) · Presenta: <nombre> · Apoyo técnico: <nombre>
- Entorno: `https://ayllu.likadev.com` y la APK de release candidata · Datos de prueba: `supabase/seed.sql` (PRP 007), sin datos reales

## Mensaje central
<Una frase: qué problema resolvemos y para quién.>

## Recorrido
Sigue `docs/revision-alcance.md` §3. Indicar en cada paso qué es real y qué es simulado.

| # | Paso en pantalla | CU | Qué decir | Real / simulado | Tiempo |
| --- | --- | --- | --- | --- | --- |
| 1 | <...> | CU-XX | <...> | <...> | <s> |

## Tareas de entrega (CC-09)
No son PRP de software: se hacen después del PRP 007 y se marcan aquí.

- [ ] Guion completo en la tabla «Recorrido».
- [ ] QR impreso que apunta a `https://ayllu.likadev.com/?lugar=Lobitos`.
- [ ] APK de release candidata (`make apk`) instalada en el celular del artesano, con la sesión iniciada.
- [ ] Cuenta del comprador con la sesión iniciada en el segundo dispositivo.
- [ ] Servidor revisado antes de presentar: web, Supabase y proxy de IA responden.
- [ ] Dos ensayos completos seguidos, cronometrados, cada uno en 3:00 o menos.
- [ ] Video de respaldo grabado y guardado fuera del repositorio. Ubicación: <ruta o enlace>.
- [ ] Entrada `0.1.0` en `CHANGELOG.md`.

## Plan B
- Si falla el servidor o la red: video de respaldo.
- Si falla la IA: «Completar a mano» y mostrar un producto semilla ya procesado.

## Preguntas esperadas
- <pregunta> → <respuesta>
