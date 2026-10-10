# Traspaso general — estado del proyecto Ayllu

- Fecha: 2026-10-10 · Responsable de la implementación: Cristopher
- Repositorio: https://github.com/luisfelix122/HACKATHON (rama `main`; política: merge directo a `main` después de `make verify`)
- Carpeta local: `C:\dev\HACKATHON`

## Dónde vamos (guía de la hackatón)
| Paso | Estado |
| --- | --- |
| 0 Estructura | hecho |
| 1 Problema y demo | hecho (`docs/revision-alcance.md`) |
| 2 Infraestructura | decidida: Supabase self-hosted, la web y LiteLLM en el servidor de Johann (0002, 0003). Falta que Johann entregue los subdominios y la ruta |
| 3 Documentos, contratos y base | hecho, salvo el primer despliegue (bloqueado por el servidor) |
| 4 Implementar por PRP | en curso (ver la tabla) |
| 5 a 7 | pendientes |

## PRP
| PRP | Estado | Pendiente |
| --- | --- | --- |
| 000 Base web + APK | código en `main` | probar la APK en un Android real; desplegar |
| 001 Acceso y acreditación (+ CC-03, CC-04, CC-06, CC-08) | código en `main`, 29 pruebas | `make test-db` (pgTAP) contra Supabase; login real con Google en un Android; aprobar CC-04 |
| 011 Sistema visual (paleta «Mar de Cabo Blanco») | en `main` | — |
| 002 Borrador sin conexión | **siguiente** | — |
| 003 IA y publicación | sin empezar | llaves de IA (no hay todavía) |
| 004 Vitrina | sin empezar | — |
| 005 Pedido y despacho | sin empezar | — |
| 006 Confirmación, pago y reserva | sin empezar | — |
| 007 Datos semilla y demo | sin empezar | — |
| 008 Traducción (opcional) | sin empezar | — |
| 009 Proxy LiteLLM | archivos sin empezar | proveedor, modelos y llaves; datos de Johann |
| 010 Supabase self-hosted y web | archivos sin empezar | subdominios y ruta (Johann); Client ID y Secret de Google |

## Decisiones vigentes que hay que recordar
- **Nombre:** Ayllu (CC-07). `appId` y deep link: `pe.ayllu.artesano`, `pe.ayllu.artesano://auth`.
- **Canales:** el comprador y el admin usan la web; el artesano usa **solo** la APK (CC-08).
- **APK:** se compila con `make apk JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot"`. JDK 21; el JDK 25 de Android Studio no sirve.
- **Servidor:** no se usa SSH desde esta máquina. Los archivos se entregan a Cristopher, que se los pasa a la laptop autorizada de Johann.
- **Supabase self-hosted:** `ADDITIONAL_REDIRECT_URLS` debe incluir `pe.ayllu.artesano://auth**` (PRP 010).

## Archivos locales fuera de git
- `.claude/launch.json`: configura la vista previa local con valores de prueba (no son secretos). Sin subir.
- `C:\dev\supabase-selfhost\docker`: copia de referencia de Supabase self-hosted v0.8.2.

## Siguiente paso
Ejecutar el PRP 002 (`docs/prp/002--borrador-sin-conexion.md`) en la rama `cu-02/borrador-sin-conexion`, siguiendo el Paso 4 de la guía.
