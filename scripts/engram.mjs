import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = '3.3.2'
const localBinary = join(homedir(), '.local', 'bin', 'engram.exe')
const binary = process.platform === 'win32' && existsSync(localBinary) ? localBinary : 'engram'
const commands = {
  mcp: ['mcp', '--tools=agent', '--project', 'hackathon'],
  import: ['sync', '--import', '--project', 'hackathon'],
  export: ['sync', '--project', 'hackathon'],
  status: ['sync', '--status', '--project', 'hackathon'],
}
const mode = process.argv[2]
if (!Object.hasOwn(commands, mode) || process.argv.length !== 3) {
  process.stderr.write('Uso: node scripts/engram.mjs mcp|import|export|status\n')
  process.exit(2)
}

// Aislar el almacenamiento del repo evita exportar memorias de otros proyectos.
// Cloud queda deshabilitado: sync escribe archivos locales y Git los comparte.
const env = {
  ...process.env,
  ENGRAM_DATA_DIR: join(root, '.engram', 'local'),
  ENGRAM_PROJECT: 'hackathon',
  ENGRAM_CLOUD_AUTOSYNC: '0',
}
delete env.ENGRAM_URL
delete env.ENGRAM_CLOUD_SERVER
delete env.ENGRAM_CLOUD_TOKEN
const detected = spawnSync(binary, ['version'], { cwd: root, env, encoding: 'utf8' })
if (detected.error || detected.status !== 0 || detected.stdout.trim() !== `engram ${version}`) {
  process.stderr.write(`Instala Engram ${version} antes de continuar. Consulta docs/engram.md.\n`)
  process.exit(1)
}

const result = spawnSync(binary, commands[mode], { cwd: root, env, stdio: 'inherit' })
if (result.error) process.stderr.write(`${result.error.message}\n`)
process.exit(result.status ?? 1)
