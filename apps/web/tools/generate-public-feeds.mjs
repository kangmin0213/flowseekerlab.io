/**
 * After Vite build: writes sitemap.xml, rss.xml, robots.txt into dist.
 * Uses PocketBase REST so static hosting gets crawlable feeds without relying on PB routes.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const webRoot = join(toolsDir, '..');

function loadEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveFetchBase(pbBase, siteUrl) {
  const b = (pbBase || '').replace(/\/$/, '');
  if (b.startsWith('http://') || b.startsWith('https://')) return b;
  const origin = siteUrl.replace(/\/$/, '');
  const path = b.startsWith('/') ? b : `/${b}`;
  return `${origin}${path}`.replace(/\/$/, '');
}

async function pbFetch(fetchBase, path) {
  const url = `${fetchBase.replace(/\/$/, '')}${path}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function collectAllRecords(fetchBase, collection, filter, sort) {
  const all = [];
  let page = 1;
  const perPage = 100;
  for (;;) {
    const q = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sort,
    });
    if (filter) q.set('filter', filter);
    const data = await pbFetch(
      fetchBase,
      `/api/collections/${collection}/records?${q.toString()}`,
    );
    all.push(...(data.items || []));
    if (!data.items?.length || data.items.length < perPage) break;
    page += 1;
    if (page > 200) break;
  }
  return all;
}

function minimalSitemap(siteUrl) {
  const u = siteUrl.replace(/\/$/, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${escapeXml(u)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${escapeXml(u)}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${escapeXml(u)}/privacy</loc><priority>0.4</priority></url>
  <url><loc>${escapeXml(u)}/terms</loc><priority>0.4</priority></url>
</urlset>`;
}

function minimalRobots(siteUrl) {
  const u = siteUrl.replace(/\/$/, '');
  return `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${u}/sitemap.xml
`;
}

const outDir = process.argv[2] || process.env.OUT_DIR;
if (!outDir) {
  console.error('[generate-public-feeds] Pass dist path: node tools/generate-public-feeds.mjs <outDir>');
  process.exit(1);
}

const env = {
  ...loadEnvFile(join(webRoot, '.env.production')),
  ...process.env,
};
const pbBase = (env.VITE_POCKETBASE_URL || '/hcgi/platform').replace(/\/$/, '');
const siteUrl = (env.SITE_URL || env.VITE_SITE_URL || 'https://flowseekerlab.io').replace(
  /\/$/,
  '',
);
const fetchBase = resolveFetchBase(pbBase, siteUrl);

async function main() {
  mkdirSync(outDir, { recursive: true });

  let posts = [];
  let categories = [];
  let tags = [];

  try {
    [posts, categories, tags] = await Promise.all([
      collectAllRecords(fetchBase, 'posts', 'status="published"', '-published_at'),
      collectAllRecords(fetchBase, 'categories', '', '-updated'),
      collectAllRecords(fetchBase, 'tags', '', '-updated'),
    ]);
    console.log(
      `[generate-public-feeds] Fetched posts=${posts.length} categories=${categories.length} tags=${tags.length}`,
    );
  } catch (e) {
    console.warn('[generate-public-feeds] PocketBase fetch failed — writing minimal feeds:', e.message);
    writeFileSync(join(outDir, 'sitemap.xml'), minimalSitemap(siteUrl), 'utf8');
    writeFileSync(join(outDir, 'robots.txt'), minimalRobots(siteUrl), 'utf8');
    writeFileSync(
      join(outDir, 'rss.xml'),
      `<?xml version="1.0"?><rss version="2.0"><channel><title>FlowSeeker Lab</title><link>${escapeXml(siteUrl)}</link><description>Feed unavailable at build time.</description></channel></rss>`,
      'utf8',
    );
    return;
  }

  const urlRows = [];
  urlRows.push(
    `<url><loc>${escapeXml(siteUrl)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${escapeXml(siteUrl)}/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
    `<url><loc>${escapeXml(siteUrl)}/search</loc><priority>0.3</priority></url>`,
    `<url><loc>${escapeXml(siteUrl)}/privacy</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
    `<url><loc>${escapeXml(siteUrl)}/terms</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`,
  );
  for (const c of categories) {
    const slug = c.slug;
    if (!slug) continue;
    urlRows.push(
      `<url><loc>${escapeXml(siteUrl)}/category/${escapeXml(slug)}</loc><lastmod>${escapeXml(new Date(c.updated).toISOString())}</lastmod><priority>0.7</priority></url>`,
    );
  }
  for (const tg of tags) {
    const slug = tg.slug;
    if (!slug) continue;
    urlRows.push(
      `<url><loc>${escapeXml(siteUrl)}/tag/${escapeXml(slug)}</loc><lastmod>${escapeXml(new Date(tg.updated).toISOString())}</lastmod><priority>0.65</priority></url>`,
    );
  }
  for (const p of posts) {
    const slug = p.slug;
    if (!slug) continue;
    urlRows.push(
      `<url><loc>${escapeXml(siteUrl)}/blog/${escapeXml(slug)}</loc><lastmod>${escapeXml(new Date(p.updated).toISOString())}</lastmod><priority>0.85</priority></url>`,
    );
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlRows.join('\n')}
</urlset>`;
  writeFileSync(join(outDir, 'sitemap.xml'), sitemap, 'utf8');

  const rssItems = posts.slice(0, 50).map((p) => {
    const link = `${siteUrl}/blog/${p.slug}`;
    const pub = new Date(p.published_at || p.created).toUTCString();
    const title = escapeXml(p.title);
    const desc = escapeXml((p.excerpt || '').slice(0, 500));
    const rawContent = String(p.content || '');
    return `
    <item>
      <title>${title}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
      <content:encoded><![CDATA[${rawContent}]]></content:encoded>
    </item>`;
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml('FlowSeeker Lab')}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml('AI & crypto analysis and build logs.')}</description>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems.join('')}
  </channel>
</rss>`;
  writeFileSync(join(outDir, 'rss.xml'), rss, 'utf8');

  writeFileSync(join(outDir, 'robots.txt'), minimalRobots(siteUrl), 'utf8');
  console.log('[generate-public-feeds] Wrote sitemap.xml, rss.xml, robots.txt →', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
