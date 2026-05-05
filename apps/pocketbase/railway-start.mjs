#!/usr/bin/env node
/**
 * Railway/Nixpacks-friendly PocketBase launcher.
 * - Uses PORT env (Railway) with fallback to 8090 for local parity.
 * - Avoids hardcoding 8090 in package.json scripts.
 * - Pins cwd to this directory so a custom Start Command / monorepo root cannot break resolution of start.js and the pocketbase binary.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const startJs = path.join(__dirname, 'start.js');

const port = process.env.PORT || '8090';
const args = [
  'serve',
  `--http=0.0.0.0:${port}`,
  '--dir=./pb_data',
  '--migrationsDir=./pb_migrations',
  '--hooksDir=./pb_hooks',
  '--hooksWatch=false',
];
// Encrypted settings DB (or Railway variable placeholder): use a 32+ char secret in PB_ENCRYPTION_KEY.
if (process.env.PB_ENCRYPTION_KEY?.trim()) {
  args.push('--encryptionEnv=PB_ENCRYPTION_KEY');
}

const child = spawn(process.execPath, [startJs, ...args], {
  stdio: 'inherit',
  cwd: __dirname,
});
child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
child.on('exit', (code) => process.exit(code ?? 0));
