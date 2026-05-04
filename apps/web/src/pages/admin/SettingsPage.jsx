import React, { useEffect, useState, useCallback } from 'react';
import { Save, Info } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import FormField from '@/components/admin/FormField.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { invalidateCmsSettingsCache } from '@/lib/cmsSettings.js';

const defaults = {
  site_name: 'FlowSeeker Lab',
  site_tagline: 'Read the flow with AI & Crypto, and turn it into action.',
  site_description:
    'High-signal analysis at the intersection of AI and crypto. Insights, alpha, and build-in-public project logs.',
  site_url: 'https://flowseekerlab.io',
  twitter_handle: '@flowseekerlab',
  posts_per_page: 20,
  comments_enabled: true,
};

function SettingsPage() {
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [site, setSite] = useState(defaults);
  const [displayName, setDisplayName] = useState('');

  const loadSite = useCallback(async () => {
    try {
      const res = await pb.collection('cms_settings').getList(1, 1, { $autoCancel: false });
      const row = res.items[0];
      if (row) {
        setRecordId(row.id);
        setSite({
          site_name: row.site_name ?? defaults.site_name,
          site_tagline: row.site_tagline ?? defaults.site_tagline,
          site_description: row.site_description ?? defaults.site_description,
          site_url: row.site_url ?? defaults.site_url,
          twitter_handle: row.twitter_handle ?? defaults.twitter_handle,
          posts_per_page: row.posts_per_page ?? defaults.posts_per_page,
          comments_enabled:
            typeof row.comments_enabled === 'boolean' ? row.comments_enabled : defaults.comments_enabled,
        });
      } else {
        setRecordId(null);
        setSite(defaults);
      }
    } catch {
      setRecordId(null);
      setSite(defaults);
      toast.error('Could not load site settings (run PocketBase migrations?)');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadSite();
      if (!cancelled && currentUser) {
        setDisplayName(currentUser.name || '');
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSite, currentUser]);

  const updateSite = (key, value) => setSite((p) => ({ ...p, [key]: value }));

  const saveSite = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    try {
      const payload = {
        site_name: site.site_name.trim() || defaults.site_name,
        site_tagline: site.site_tagline,
        site_description: site.site_description,
        site_url: site.site_url.trim() || defaults.site_url,
        twitter_handle: site.twitter_handle.trim(),
        posts_per_page: Math.min(100, Math.max(1, Number(site.posts_per_page) || 20)),
        comments_enabled: !!site.comments_enabled,
      };
      if (recordId) {
        await pb.collection('cms_settings').update(recordId, payload, { $autoCancel: false });
      } else {
        const created = await pb.collection('cms_settings').create(payload, { $autoCancel: false });
        setRecordId(created.id);
      }
      invalidateCmsSettingsCache();
      toast.success('Site settings saved');
      await loadSite();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      await pb.collection('users').update(
        currentUser.id,
        { name: displayName.trim() || currentUser.email },
        { $autoCancel: false },
      );
      try {
        await pb.collection('users').authRefresh({ $autoCancel: false });
      } catch {
        /* session may still be valid without refresh */
      }
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold">Settings</h2>
        <p className="text-[hsl(var(--muted-foreground))]">
          Profile for everyone · Site-wide options are stored in PocketBase and apply to list sizes and comments.
        </p>
      </div>

      <div className="admin-card p-4 mb-6 flex gap-3 border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-hover))/25]">
        <Info className="h-5 w-5 shrink-0 text-[hsl(var(--admin-accent))] mt-0.5" />
        <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
          <p>
            <strong className="text-[hsl(var(--admin-text))]">Users</strong> remains admin-only (roles, invites,
            deletion).
          </p>
          <p>
            <strong className="text-[hsl(var(--admin-text))]">Site</strong> fields below are the single source for
            posts-per-page and toggling public comments. SEO title/description on the public site still come from{' '}
            <code className="text-xs bg-[hsl(var(--admin-hover))] px-1 rounded">apps/web/src/lib/seo.js</code> and
            build-time env unless you wire them to <code className="text-xs bg-[hsl(var(--admin-hover))] px-1 rounded">cms_settings</code> later.
          </p>
        </div>
      </div>

      <div className="grid gap-8 max-w-3xl">
        <section>
          <h3 className="text-lg font-semibold mb-3">Your profile</h3>
          <form onSubmit={saveProfile} className="admin-card p-6 space-y-4">
            <FormField label="Email">
              <input
                readOnly
                value={currentUser?.email || ''}
                className="w-full bg-[hsl(var(--admin-hover))/50] border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm text-muted-foreground"
              />
            </FormField>
            <FormField label="Display name">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                placeholder="Shown on posts"
              />
            </FormField>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-[hsl(var(--admin-accent))] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> Save profile
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-3">Site configuration</h3>
          {!isAdmin ? (
            <div className="admin-card p-6 text-sm text-[hsl(var(--muted-foreground))] space-y-3">
              <p>Only admins can edit site-wide settings. Current values (read-only):</p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-xs">
                <li>site_name: {site.site_name}</li>
                <li>posts_per_page: {site.posts_per_page}</li>
                <li>comments_enabled: {String(site.comments_enabled)}</li>
                <li>site_url: {site.site_url}</li>
              </ul>
            </div>
          ) : (
            <form onSubmit={saveSite} className="admin-card p-6 space-y-4">
              <FormField label="Site name">
                <input
                  value={site.site_name}
                  onChange={(e) => updateSite('site_name', e.target.value)}
                  className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                />
              </FormField>
              <FormField label="Tagline">
                <input
                  value={site.site_tagline}
                  onChange={(e) => updateSite('site_tagline', e.target.value)}
                  className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                />
              </FormField>
              <FormField label="Short description">
                <textarea
                  rows={3}
                  value={site.site_description}
                  onChange={(e) => updateSite('site_description', e.target.value)}
                  className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Public site URL">
                  <input
                    value={site.site_url}
                    onChange={(e) => updateSite('site_url', e.target.value)}
                    className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                    placeholder="https://…"
                  />
                </FormField>
                <FormField label="Twitter / X handle">
                  <input
                    value={site.twitter_handle}
                    onChange={(e) => updateSite('twitter_handle', e.target.value)}
                    className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                    placeholder="@handle"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Posts per page (blog, search, tag lists)">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={site.posts_per_page}
                    onChange={(e) => updateSite('posts_per_page', parseInt(e.target.value, 10) || 20)}
                    className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
                  />
                </FormField>
                <FormField label="Public comments">
                  <label className="flex items-center gap-2 mt-2 text-sm">
                    <input
                      type="checkbox"
                      checked={site.comments_enabled}
                      onChange={(e) => updateSite('comments_enabled', e.target.checked)}
                    />
                    Allow visitors to submit comments (still moderated)
                  </label>
                </FormField>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[hsl(var(--admin-text))] text-[hsl(var(--admin-bg))] px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save site settings
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

export default SettingsPage;
