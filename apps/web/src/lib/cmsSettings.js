import pb from '@/lib/pocketbaseClient.js';

let cache = { row: undefined, at: 0 };
const TTL_MS = 60_000;

export async function getCmsSettingsRow() {
  if (cache.row !== undefined && Date.now() - cache.at < TTL_MS) {
    return cache.row;
  }
  try {
    const res = await pb.collection('cms_settings').getList(1, 1, { $autoCancel: false });
    const row = res.items[0] || null;
    cache = { row, at: Date.now() };
    return row;
  } catch {
    cache = { row: null, at: Date.now() };
    return null;
  }
}

export function invalidateCmsSettingsCache() {
  cache = { row: undefined, at: 0 };
}

/** Blog/search list page size (1–100), default 20. */
export async function getPostsPerPage() {
  const row = await getCmsSettingsRow();
  const n = row?.posts_per_page;
  if (typeof n === 'number' && Number.isFinite(n)) {
    return Math.min(100, Math.max(1, Math.floor(n)));
  }
  return 20;
}

/** Whether public comment forms should be shown (best-effort). */
export async function getCommentsEnabled() {
  const row = await getCmsSettingsRow();
  if (row && typeof row.comments_enabled === 'boolean') return row.comments_enabled;
  return true;
}
