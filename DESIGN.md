# DESIGN — Ayllu: costa artesanal

La autoridad visual final es Chero, commits 9e70c08 y 3e47151 (PRP014/CC19). PRP013 y CC16 originales se preservan como historia; no se sustituyen por homónimos de otra rama.

## Identidad
Cabecera cal, emblema dorado con sol/chalana/A, azul costero #1D3F5E, fondo #FAF8F4 y Fraunces empaquetada para títulos. Atkinson Hyperlegible permanece para lectura y controles. Los assets editoriales incluyen procedencia en public/editorial/PROVENANCE.md y no representan productos reales.

## Superficies
- Web: presentación costera fuente Chero, CSS aislado en .web-ayllu y catálogo/rutas vigentes.
- APK: misma identidad en .artesano-ayllu, texto base 18px, pasos y pestañas inferiores actuales, objetivos de 48px y safe areas; no escalar navegación de escritorio.
- Shared Modal/Icono y componentes funcionales de main se conservan. El emblema reemplaza solo la marca provisional.
- Launcher Android usa el mismo dibujo vectorial fuente, con versiones legacy/redonda y capa adaptativa.

## Accesibilidad y estados
Foco visible, aviso de error/loading/vacío, contraste para lectura al sol, no interacción dependiente de hover. Las reglas de reducción de movimiento del sistema compartido se mantienen. Se verifican vistas 360px/1440px en pasada acotada; dispositivo real y OAuth remoto no se infieren del build.

## Términos
Ruta pública /terminos en web/APK; borrador no final, aceptación explícita por cuenta/version solamente local. No atribuir cumplimiento jurídico ni auditoría servidor.
