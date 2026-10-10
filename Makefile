# Requisito: GNU make instalado en TODAS las computadoras del equipo.
#   Windows: winget install ezwinports.make
#   macOS:   xcode-select --install   (o brew install make)
#   Linux:   sudo apt install make
#
# Stack: POR DEFINIR. Cada check falla a propósito hasta reemplazar su comando
# por el real (p. ej. lint, chequeo de formato, verificación de tipos, tests).
# No sustituir por un comando que "pase" sin verificar nada.

.PHONY: help verify lint format-check typecheck test

help:
	@echo "make verify        lint + format-check + typecheck + test"
	@echo "make lint          PENDIENTE: definir con el stack"
	@echo "make format-check  PENDIENTE: definir con el stack"
	@echo "make typecheck     PENDIENTE: definir con el stack"
	@echo "make test          PENDIENTE: definir con el stack"

verify: lint format-check typecheck test

lint:
	@echo "PENDIENTE: comando de lint no definido (stack por definir)" && exit 1

format-check:
	@echo "PENDIENTE: comando de comprobacion de formato no definido (stack por definir)" && exit 1

typecheck:
	@echo "PENDIENTE: comando de verificacion de tipos no definido (stack por definir)" && exit 1

test:
	@echo "PENDIENTE: comando de tests no definido (stack por definir)" && exit 1
