#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWindows = process.platform === 'win32';
const binary = path.join(__dirname, isWindows ? 'pocketbase.exe' : 'pocketbase');

if (!existsSync(binary)) {
  console.error(
    `\n[pocketbase] binary not found at ${binary}\n` +
      `Download v${readVersion()} for ${process.platform}/${process.arch} from\n` +
      `  https://github.com/pocketbase/pocketbase/releases\n` +
      `and place it in apps/pocketbase/ as ${path.basename(binary)}.\n`
  );
  process.exit(1);
}

if (!isWindows) {
  try {
    const mode = statSync(binary).mode;
    if ((mode & 0o111) === 0) {
      console.error(`[pocketbase] ${binary} is not executable. Run: chmod +x ${binary}`);
      process.exit(1);
    }
  } catch {
    /* ignore */
  }
}

const args = process.argv.slice(2);
const child = spawn(binary, args, { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));

function readVersion() {
  try {
    const versionFile = path.join(__dirname, '.pocketbase-version');
    if (existsSync(versionFile)) {
      return (
        require('node:fs').readFileSync(versionFile, 'utf8').trim() || '0.36.7'
      );
    }
  } catch {
    /* ignore */
  }
  return '0.36.7';
}
