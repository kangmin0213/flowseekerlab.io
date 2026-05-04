import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import EmptyState from '@/components/admin/EmptyState.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

function TagsPage() {
  const { isAdmin } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await pb.collection('tags').getFullList({ sort: 'name', $autoCancel: false });
      setTags(list);
    } catch {
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await pb.collection('tags').create({ name, slug: slugify(name) }, { $autoCancel: false });
      setName('');
      toast.success('Tag added');
      load();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this tag?')) return;
    try {
      await pb.collection('tags').delete(id, { $autoCancel: false });
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold">Tags</h2>
        <p className="text-[hsl(var(--muted-foreground))]">Lightweight taxonomy for posts.</p>
        {!isAdmin && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Deleting tags is limited to admins; you can add tags and use them in posts.
          </p>
        )}
      </div>

      <form onSubmit={create} className="admin-card p-4 mb-6 flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag name"
          className="flex-1 bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-[hsl(var(--admin-accent))] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <div className="admin-card p-4">
        {loading ? (
          <div className="py-12 flex justify-center"><LoadingSpinner /></div>
        ) : tags.length === 0 ? (
          <EmptyState title="No tags" description="Add tags to organize your content." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-hover))/40] text-sm"
              >
                {tag.name}
                {isAdmin && (
                  <button onClick={() => remove(tag.id)} className="opacity-50 group-hover:opacity-100 hover:text-[hsl(var(--admin-error))]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default TagsPage;
