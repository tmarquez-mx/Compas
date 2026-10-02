'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--built')) { console.error('Uso: node scripts/test.cjs [--built]'); process.exit(1); }
function run(script, parameters = []) {
  const result = spawnSync(process.execPath, [script, ...parameters], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
// --built comprueba la entrega actual sin regenerarla; lo usa el empaquetado.
if (!args.includes('--built')) run('scripts/build.cjs');
run('scripts/build.cjs', ['--check']);
run('scripts/check_build.cjs');
const tests = fs.readdirSync(path.join(root, 'tests')).filter(name => /^check_.*\.cjs$/.test(name)).sort();
for (const required of ['check_compas.cjs', 'check_todo_import.cjs', 'check_storage.cjs', 'check_runtime.cjs']) {
  if (!tests.includes(required)) throw new Error('Falta una prueba obligatoria: ' + required);
}
for (const test of tests) run(path.join('tests', test));
console.log('Entrega verificada: build y ' + tests.length + ' archivos de pruebas.');
