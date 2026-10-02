'use strict';
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const scripts = new Set(['scripts/servir_local.py', 'scripts/crear_paquete.py']);
if (!scripts.has(args[0])) {
  console.error('Indica scripts/servir_local.py o scripts/crear_paquete.py.');
  process.exit(1);
}
const candidates = process.platform === 'win32'
  ? [['py', ['-3']], ['python', []], ['python3', []]]
  : [['python3', []], ['python', []]];
for (const [command, prefix] of candidates) {
  const probe = spawnSync(command, [...prefix, '-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)'], { stdio: 'ignore' });
  if (probe.status !== 0) continue;
  const result = spawnSync(command, [...prefix, ...args], { cwd: root, stdio: 'inherit' });
  if (result.error) { console.error(result.error.message); process.exit(1); }
  process.exit(result.status || (result.signal ? 1 : 0));
}
console.error('Instala Python 3.9 o posterior y comprueba que python3, python o py esté disponible.');
process.exit(1);
