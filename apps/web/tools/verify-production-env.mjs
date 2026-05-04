/**
 * Runs before `vite build`. Ensures production PocketBase URL is defined
 * so Hostinger and CI builds match the live API (single backend contract).
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = dirname(fileURLToPath(import.meta.url));
const envPath = join(webRoot, '..', '.env.production');
const examplePath = join(webRoot, '..', '.env.production.example');

if (!existsSync(envPath)) {
  if (existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.log(
      '[verify-production-env] Created apps/web/.env.production from .env.production.example',
    );
  } else {
    console.error(
      '[verify-production-env] Missing apps/web/.env.production and no .env.production.example.\n' +
        'Run `npm run bootstrap` from the repo root, or copy .env.production.example manually.',
    );
    process.exit(1);
  }
}

const raw = readFileSync(envPath, 'utf8');
const lines = raw.split(/\r?\n/).filter((l) => {
  const t = l.trim();
  return t && !t.startsWith('#');
});
const pbLine = lines.find((l) => /^\s*VITE_POCKETBASE_URL\s*=/.test(l));
if (!pbLine) {
  console.error(
    '[verify-production-env] apps/web/.env.production must define VITE_POCKETBASE_URL=...',
  );
  process.exit(1);
}
const value = pbLine.split('=').slice(1).join('=').trim();
if (!value) {
  console.error('[verify-production-env] VITE_POCKETBASE_URL is empty.');
  process.exit(1);
}

console.log('[verify-production-env] OK — VITE_POCKETBASE_URL is set.');
