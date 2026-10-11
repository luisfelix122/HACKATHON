# Instalar Engram y recuperar la memoria del equipo

Cada compañero instala Engram en su propia computadora y después importa la
memoria compartida de **HACKATHON**. `setup` configura una integración; `sync`
transfiere recuerdos, **no instala el MCP ni accede a otra computadora**.

## Qué enviar al equipo

Enviar este documento y la carpeta `.engram/`, conservando `config.json`,
`manifest.json` y **todos** los archivos `chunks/*.jsonl.gz`. No enviar
`.engram/local/`, bases SQLite, ejecutables, credenciales ni recuerdos personales.
Copiar los archivos compartidos a la raíz del clon de HACKATHON sin eliminar
chunks existentes ni sobrescribir cambios propios del equipo.

Esta entrega permanece local: no tiene commit ni push. `git pull` todavía no
recuperará este documento ni el chunk nuevo. Si dos manifiestos tienen entradas
distintas, coordinar su combinación con el responsable; no descartar ninguno.

## 1. Instalar en Windows

El repositorio exige **Engram 3.3.2** mediante `scripts/engram.mjs`. Descargar el
ZIP de Windows de la [publicación oficial 3.3.2](https://github.com/Gentleman-Programming/engram/releases/tag/v3.3.2)
y `checksums.txt`. Usar `amd64` para equipos x64 o `arm64` para Windows ARM.

Desde PowerShell, en la carpeta que contiene ambas descargas (ejemplo x64):

```powershell
$zip = 'engram_3.3.2_windows_amd64.zip'
$expected = (Get-Content .\checksums.txt | Where-Object {
  $_ -match ('\s' + [regex]::Escape($zip) + '$')
}).Split(' ', [StringSplitOptions]::RemoveEmptyEntries)[0]
$actual = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw 'SHA-256 no coincide; detener instalación' }
Expand-Archive -LiteralPath $zip -DestinationPath "$env:USERPROFILE\.local\bin"
& "$env:USERPROFILE\.local\bin\engram.exe" version
```

Debe imprimir `engram 3.3.2`. Si existe un binario anterior, no reemplazarlo sin
revisarlo: extraer primero en otra carpeta y coordinar la actualización. No
desactivar el antivirus ante una alerta. Para `engram setup` y comandos directos,
añadir `%USERPROFILE%\.local\bin` al PATH de usuario y abrir otra terminal.
`Get-Command engram` permite comprobar qué ejecutable se está usando.

La [guía existente](../engram.md) describe también macOS/Linux. Esta entrega no
instaló software global ni modificó la configuración de ningún compañero.

## 2. Importar y conectar Claude Code

Requisitos: clon del proyecto, Node.js disponible y Engram 3.3.2 instalado.
Desde la raíz del clon:

```powershell
node scripts/engram.mjs import
node scripts/engram.mjs status
```

El wrapper importa los chunks en `.engram/local/` y fuerza el proyecto
`hackathon`. Claude Code ya tiene el MCP registrado en `.mcp.json`; no reemplazar
ese archivo ni añadir otro Engram global para este proyecto. Cerrar y abrir la
sesión de Claude Code, revisar `/mcp` y confirmar la conexión. Pedir al agente:

> Usa `mem_context` y `mem_search` del proyecto `hackathon`. Recupera el bloqueo
> del PRP 005 con `mem_get_observation` y explica qué falta antes de editar.

Para configurar Claude Code **fuera de este clon**, la integración oficial es
`engram setup claude-code`: revisar los cambios y permisos solicitados, y
reiniciar Claude Code. No ejecutarla aquí solo para importar memoria: configura
el cliente, no reemplaza el wrapper aislado del proyecto. En Windows, los hooks
del plugin requieren Git Bash o WSL; el MCP stdio es la alternativa sin hooks.

Si otro asistente admite MCP pero no tiene integración automática, configurar
en su formato propio un servidor stdio con el ejecutable `engram` y argumentos
`["mcp", "--tools=agent", "--project", "hackathon"]`. Para conservar el aislamiento
de este clon, preferir `node scripts/engram.mjs mcp` con la raíz del clon como
directorio de trabajo. No copiar configuraciones de un cliente a otro sin
consultar su documentación ni borrar servidores existentes.

## 3. Compartir recuerdos después

Usar el wrapper del proyecto:

```powershell
node scripts/engram.mjs export
node scripts/engram.mjs status
```

Equivalentes del CLI: `engram sync --project hackathon` exporta, y
`engram sync --import --project hackathon` importa. Ejecutarlos directamente usa
la base configurada por `ENGRAM_DATA_DIR` o la base global; **no equivale al
aislamiento del wrapper**. Importar lee los chunks recibidos: comprobar antes
que todos pertenecen al proyecto esperado.

Antes de compartir, revisar el contenido descomprimido: solo proyecto
`hackathon`, sin tokens, contraseñas, datos personales ni conversaciones privadas.
Nunca usar `sync --all`, `engram export` global ni enviar `~/.engram/engram.db`.
El export no hace push; publicar requiere autorización y revisión de los archivos.
Los recuerdos son contexto histórico, no sustituyen los PRP y contratos vigentes.

## Estado entregado y comprobaciones

- PRP 005 local en `cu-05/pedido-despacho`, sin aprobación, commit ni integración.
  Evidencia completa: [CU-05-Luis.md](CU-05-Luis.md).
- 13 pruebas propias pasan; suite completa: **85 pasan y 1 falla**. La prueba
  antigua de `src/app/app.test.tsx` monta «Pedir» sin Router y espera el stub
  deshabilitado. El fallo es técnico; la propiedad de Cristopher solo impide
  editar ese archivo fuera del alcance. Se deja intacto para su responsable.
- SQL, permisos en BD real y recorridos manuales continúan pendientes. PRP 006
  y 008 no están implementados; 008 espera dependencias de 003 y 000–007.
- CLI local observado: 1.20.0; wrapper del repo: 3.3.2. No se actualizó el CLI
  global. Se verificó el SHA-256 de un binario oficial 3.3.2 temporal y se probó
  con él la importación del export 1.20.0 en una base aislada: cinco chunks,
  19 observaciones, cero prompts, solo `hackathon`; segunda importación sin
  chunks nuevos. Esto valida esta entrega concreta, no toda compatibilidad
  entre versiones. No se probó la conexión en las computadoras de los compañeros.

## Fuentes

- [Instalación oficial de Engram](https://github.com/Gentleman-Programming/engram/blob/v3.3.2/docs/INSTALLATION.md).
- [Configuración de agentes](https://github.com/Gentleman-Programming/engram/blob/v3.3.2/docs/AGENT-SETUP.md).
- [Git Sync y CLI](https://github.com/Gentleman-Programming/engram/blob/v3.3.2/DOCS.md).
