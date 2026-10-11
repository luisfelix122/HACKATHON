# Requisito: GNU make instalado en TODAS las computadoras del equipo.
#   Windows: winget install ezwinports.make
#   macOS:   xcode-select --install   (o brew install make)
#   Linux:   sudo apt install make
#
# Stack: React + TypeScript + Vite, Supabase y Capacitor (docs/decisiones/0001-stack.md).
# Ningún objetivo se reemplaza por un comando que "pase" sin verificar nada.

.PHONY: help verify lint format-check typecheck test build apk test-db

# Compilar Android: Capacitor 8 genera Gradle 8.14, que requiere JDK 21; el JDK 25
# de Android Studio no sirve. Instalar con: winget install EclipseAdoptium.Temurin.21.JDK
# Se sobrescriben así: make apk JDK21_HOME=/ruta/jdk-21 ANDROID_HOME=/ruta/Sdk
JDK21_HOME ?= C:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot
ANDROID_HOME ?= $(LOCALAPPDATA)/Android/Sdk
# En Windows, git con autocrlf deja `gradlew` con CRLF y sh no lo ejecuta: se usa el .bat.
GRADLEW := $(if $(filter Windows_NT,$(OS)),./gradlew.bat,./gradlew)

help:
	@echo "make verify        lint + format-check + typecheck + test"
	@echo "make lint          npm run lint (ESLint)"
	@echo "make format-check  npm run format:check (Prettier)"
	@echo "make typecheck     npm run typecheck (tsc)"
	@echo "make test          npm run test -- --run (Vitest)"
	@echo "make build         build de la web (dist-web) y de la app del artesano (dist-artesano)"
	@echo "make apk           APK de debug del artesano (requiere JDK 21 y el SDK de Android)"
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
	@test -d "$(JDK21_HOME)" || { echo "No existe JDK21_HOME=$(JDK21_HOME). Instala JDK 21 o pasa make apk JDK21_HOME=/ruta."; exit 1; }
	@test -d "$(ANDROID_HOME)" || { echo "No existe ANDROID_HOME=$(ANDROID_HOME). Instala el SDK de Android o pasa make apk ANDROID_HOME=/ruta."; exit 1; }
	npm run build:artesano
	npx cap sync android
	cd android && JAVA_HOME="$(JDK21_HOME)" ANDROID_HOME="$(ANDROID_HOME)" $(GRADLEW) assembleDebug
	@echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"

test-db:
	@docker info >/dev/null 2>&1 || { echo "Docker no está corriendo: inicia Docker Desktop y luego 'npx supabase start'."; exit 1; }
	npx supabase test db
