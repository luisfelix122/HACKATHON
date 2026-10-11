# Catálogo de ubicaciones

La migración 0303 carga datos de referencia en departamento, provincia y distrito, con lectura pública y sin escritura desde el cliente. No son datos de prueba.

Fuente declarada: Directorio Nacional de Municipalidades Provinciales y Distritales INEI, mayo 2026. Se utilizó la copia estructurada de https://github.com/leandrofrancisco03/Ubigeo-Peru-2026/tree/7b73309b51cfb9bcc025fde6e172bf7707310b9f porque los portales oficiales devolvieron 403/418 durante esta sesión. No se afirma que incluya creaciones posteriores.

Conteos: 25 departamentos (incluye Callao), 196 provincias, 1892 distritos. Los nombres se presentan con mayúscula inicial; los códigos conservan ceros iniciales. Se omitió department_id redundante en distrito.

SHA-256 de los JSON de origen:
- departamentos: d21b47ae409bc55b57319f3880baf859d8b78173d5b95c4d2f3c0c92a06d8c58
- provincias: b2b4ea000c8a6bf4746f8bf5a5d1b8a908b075b5aced18f66ffa5e0a4697e3c5
- distritos: 39f5f643f44fa10b73a67f7450054549c80beefe517539d1ff15560c8cf6d749

## Aplicación

Aplicar las migraciones pendientes con el mecanismo habitual de Supabase antes de publicar esta versión. Este cambio no aplica SQL al servidor. Los selectores mostrarán error recuperable si falta el catálogo. Los pedidos antiguos sin DNI conservan compatibilidad; los envíos nuevos requieren DNI de ocho dígitos y una ubicación de la jerarquía.
