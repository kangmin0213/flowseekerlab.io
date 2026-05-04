#!/usr/bin/env node
import { existsSync, mkdirSync, createWriteStream, readFileSync, chmodSync, renameSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VERSION = readFileSync(path.join(__dirname, '.pocketbase-version'), 'utf8').trim();

const PLATFORMS = {
  'win32-x64': { asset: `pocketbase_${VERSION}_windows_amd64.zip`, exe: 'pocketbase.exe' },
  'linux-x64': { asset: `pocketbase_${VERSION}_linux_amd64.zip`, exe: 'pocketbase' },
  'linux-arm64': { asset: `pocketbase_${VERSION}_linux_arm64.zip`, exe: 'pocketbase' },
  'darwin-x64': { asset: `pocketbase_${VERSION}_darwin_amd64.zip`, exe: 'pocketbase' },
  'darwin-arm64': { asset: `pocketbase_${VERSION}_darwin_arm64.zip`, exe: 'pocketbase' },
};

const key = `${process.platform}-${process.arch}`;
const target = PLATFORMS[key];
if (!target) {
  console.error(`Unsupported platform: ${key}`);
  process.exit(1);
}

const dest = path.join(__dirname, target.exe);
if (existsSync(dest)) {
  // Verify it runs on this platform; if not, replace.
  try {
    execSync(`"${dest}" --version`, { stdio: 'ignore' });
    console.log(`[pocketbase] ${target.exe} already installed and runnable.`);
    process.exit(0);
  } catch {
    console.log(`[pocketbase] existing ${target.exe} is not runnable on ${key}, replacing.`);
    rmSync(dest);
  }
}

const url = `https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/${target.asset}`;
const tmpZip = path.join(tmpdir(), target.asset);

console.log(`[pocketbase] downloading ${url}`);
await download(url, tmpZip);

console.log(`[pocketbase] extracting to ${__dirname}`);
extractZip(tmpZip, __dirname);

if (process.platform !== 'win32') chmodSync(dest, 0o755);
rmSync(tmpZip);

console.log(`[pocketbase] installed v${VERSION} (${target.exe})`);

async function download(srcUrl, outPath, redirects = 0) {
  if (redirects > 5) throw new Error('Too many redirects');
  return new Promise((resolve, reject) => {
    import('node:https').then(({ default: https }) => {
      https
        .get(srcUrl, (res) => {
          if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
            res.resume();
            return download(res.headers.location, outPath, redirects + 1).then(resolve, reject);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode} for ${srcUrl}`));
          }
          const file = createWriteStream(outPath);
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
          file.on('error', reject);
        })
        .on('error', reject);
    });
  });
}

function extractZip(zipPath, outDir) {
  mkdirSync(outDir, { recursive: true });
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${outDir}'"`,
      { stdio: 'inherit' }
    );
  } else {
    execSync(`unzip -o "${zipPath}" -d "${outDir}"`, { stdio: 'inherit' });
  }
}
