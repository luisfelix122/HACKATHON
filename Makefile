# Requisito: GNU make instalado en TODAS las computadoras del equipo.
#   Windows: winget install ezwinports.make
#   macOS:   xcode-select --install   (o brew install make)
#   Linux:   sudo apt install make
#
# Stack: React + TypeScript + Vite, Supabase y Capacitor (docs/decisiones/0001-stack.md).
# Ningún objetivo se reemplaza por un comando que "pase" sin verificar nada.

.PHONY: help verify lint format-check typecheck test build apk test-db

# Rutas para compilar Android. Gradle 8.14 (Capacitor 8) requiere JDK 17-24; el JBR
# de Android Studio es JDK 25 y no sirve. Instalar JDK 21:
#   winget install EclipseAdoptium.Temurin.21.JDK   (define JAVA_HOME del sistema)
# Se pueden sobrescribir: make apk JAVA_HOME=/ruta ANDROID_HOME=/ruta
JAVA_HOME ?= $(error JAVA_HOME no definido: instala JDK 21 (ver comentario en Makefile))
ANDROID_HOME ?= $(LOCALAPPDATA)/Android/Sdk

help:
	@echo "make verify        lint + format-check + typecheck + test"
	@echo "make build         build de la web y de la app del artesano"
	@echo "make apk           APK de debug del artesano (requiere Android Studio/SDK)"
	@echo "make test-db       pruebas pgTAP (requiere Docker y 'npx supabase start')"

verify: lint format-check typecheck test

lint:
	npm run lint

format-check:
	npm run format:check

typecheck:
	npm run typecheck

test:
	npm run test -- --run

build:
	npm run build:web
	npm run build:artesano

apk:
	npm run build:artesano
	npx cap sync android
	cd android && JAVA_HOME="$(JAVA_HOME)" ANDROID_HOME="$(ANDROID_HOME)" ./gradlew assembleDebug
	@echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"

test-db:
	@docker info >/dev/null 2>&1 || { echo "Docker no está corriendo: inicia Docker Desktop y luego 'npx supabase start'."; exit 1; }
	npx supabase test db
