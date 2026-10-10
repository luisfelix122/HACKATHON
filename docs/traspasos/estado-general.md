# Traspaso general — estado del proyecto Ayllu

- Fecha: 2026-10-10 · Responsable de la implementación: Cristopher
- Repositorio: https://github.com/luisfelix122/HACKATHON (rama `main`; política: merge directo a `main` después de `make verify`)
- Carpeta local: `C:\dev\HACKATHON`

## Estado actual
En `main` solo hay **documentación** (`.md`) y la configuración del flujo de trabajo (`Makefile` en su versión «pendiente», `.gitignore`, `.env.example`, `.claude/`, `.agents/`, `.gemini/`, `.opencode/`). El código se implementa **PRP por PRP**, uno a la vez.

Una implementación anterior de los PRP 000, 001 y 011 (con CC-06, CC-07 y CC-08) quedó en la etiqueta de git **`respaldo-implementacion`** (commit `1832a54`). Sirve de referencia; no forma parte de `main`. Para recuperar un archivo:

```bash
git checkout respaldo-implementacion -- <ruta>
```

## Dónde vamos (guía de la hackatón)
| Paso | Estado |
| --- | --- |
| 0 Estructura | hecho |
| 1 Problema y demo | hecho (`docs/revision-alcance.md`) |
| 2 Infraestructura | decidida: Supabase self-hosted, la web y LiteLLM en el servidor de Johann (0002, 0003). Faltan los subdominios y la ruta, que entrega Johann |
| 3 Documentos, contratos y PRP | hecho; la base funcional (PRP 000) está por implementar |
| 4 Implementar por PRP | por empezar, desde el PRP 000 |
| 5 a 7 | pendientes |

## PRP (todos listos para implementar)
| Orden | PRP | Depende de | Bloqueos externos |
| --- | --- | --- | --- |
| 1 | 000 Base web + APK | — | — |
| 2 | 011 Sistema visual | 000 | — |
| 3 | 001 Acceso y acreditación (CC-03, CC-04, CC-06, CC-08) | 000 | Supabase para probar el login; aprobar CC-04 |
| 4 | 002 Borrador sin conexión | 000, 001 | — |
| 5 | 003 IA y publicación | 002 | llaves de IA |
| 6 | 004 Vitrina | 000 (datos semilla) | — |
| 7 | 005 Pedido y despacho | 001, 004 | — |
| 8 | 006 Confirmación, pago y reserva | 005 | — |
| 9 | 007 Datos semilla y demo | 004–006 | — |
| — | 008 Traducción (opcional) | 005 | llaves de IA |
| — | 009 Proxy LiteLLM | — | proveedor, modelos y llaves; datos de Johann |
| — | 010 Supabase self-hosted y web | — | subdominios y ruta (Johann); Client ID y Secret de Google |

## Decisiones vigentes que hay que recordar
- **Nombre:** Ayllu (CC-07). `appId` y deep link: `pe.ayllu.artesano`, `pe.ayllu.artesano://auth`.
- **Canales:** el comprador y el admin usan la web; el artesano usa **solo** la APK (CC-08).
- **Stack:** React + TypeScript + Vite + Capacitor 8 + Supabase self-hosted (0001, 0003).
- **APK:** el JDK 25 de Android Studio no funciona con el Gradle de Capacitor 8; hace falta el JDK 21, ya instalado en `C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot`.
- **Formato en Windows:** el checkout convierte a CRLF. Configurar Prettier con `"endOfLine": "auto"` y un `.gitattributes` con LF para `gradlew` y `*.sh` (lección de la implementación anterior).
- **Pruebas:** con Vitest sin `globals`, llamar a `cleanup()` de Testing Library en `afterEach`.
- **Servidor:** no se usa SSH desde esta máquina. Los archivos se entregan a Cristopher, que se los pasa a la laptop autorizada de Johann.
- **Supabase self-hosted:** `ADDITIONAL_REDIRECT_URLS` debe incluir `pe.ayllu.artesano://auth**` (PRP 010).

## Siguiente paso
Implementar el PRP 000 (`docs/prp/000--base-web-apk.md`) en la rama `cu-00/base-web-apk`, siguiendo el Paso 4 de la guía.
