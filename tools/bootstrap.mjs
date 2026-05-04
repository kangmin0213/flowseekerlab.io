/**
 * After `git clone`, run from repo root: `npm run bootstrap`
 * Creates gitignored .env files from tracked *.example files (no secrets in repo).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function copyIfMissing(src, dest, label) {
  if (existsSync(dest)) {
    console.log(`[bootstrap] skip ${label} (already exists)`);
    return;
  }
  if (!existsSync(src)) {
    console.warn(`[bootstrap] skip ${label} (missing source: ${src})`);
    return;
  }
  copyFileSync(src, dest);
  console.log(`[bootstrap] created ${label}`);
}

copyIfMissing(
  join(repoRoot, 'apps/web/.env.example'),
  join(repoRoot, 'apps/web/.env'),
  'apps/web/.env',
);
copyIfMissing(
  join(repoRoot, 'apps/web/.env.production.example'),
  join(repoRoot, 'apps/web/.env.production'),
  'apps/web/.env.production',
);
copyIfMissing(
  join(repoRoot, 'apps/api/.env.example'),
  join(repoRoot, 'apps/api/.env'),
  'apps/api/.env',
);

console.log('[bootstrap] done. Next: npm run setup (root), then npm run dev:web and/or API with PB_* filled in apps/api/.env');
