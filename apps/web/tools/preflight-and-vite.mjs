/**
 * Cross-platform build entry: verify env, best-effort llms generation, then vite build.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(toolsDir, '..');

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    cwd: webRoot,
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('node', [join(toolsDir, 'verify-production-env.mjs')]);
spawnSync('node', [join(toolsDir, 'generate-llms.js')], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: webRoot,
});

const outDir = join(webRoot, '..', '..', 'dist', 'apps', 'web');
run('npx', ['vite', 'build', '--outDir', outDir]);
spawnSync('node', [join(toolsDir, 'generate-public-feeds.mjs'), outDir], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: webRoot,
});
