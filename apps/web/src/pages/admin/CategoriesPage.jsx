import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import EmptyState from '@/components/admin/EmptyState.jsx';
import FormField from '@/components/admin/FormField.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const slugify = (s) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

function CategoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: '', slug: '', description: '', parent_id: '' }
  );
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, slug: form.slug || slugify(form.name) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="admin-card p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
          />
        </FormField>
        <FormField label="Slug">
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            placeholder="auto-from-name"
            className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm font-mono focus:border-[hsl(var(--admin-accent))] focus:outline-none"
          />
        </FormField>
      </div>
      <FormField label="Description">
        <textarea
          rows={2}
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-3 py-2 text-sm focus:border-[hsl(var(--admin-accent))] focus:outline-none"
        />
      </FormField>
      <div className="flex justify-end gap-2 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-sm border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-hover))] transition-colors flex items-center gap-2"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-[hsl(var(--admin-accent))] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> Save
        </button>
      </div>
    </form>
  );
}

function CategoriesPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const cats = await pb.collection('categories').getFullList({
        sort: 'name',
        $autoCancel: false,
      });
      setItems(cats);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (data) => {
    try {
      await pb.collection('categories').create(data, { $autoCancel: false });
      toast.success('Category created');
      setCreating(false);
      load();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create');
    }
  };

  const update = async (data) => {
    try {
      await pb.collection('categories').update(editing.id, data, { $autoCancel: false });
      toast.success('Category updated');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await pb.collection('categories').delete(id, { $autoCancel: false });
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to delete');
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold">Categories</h2>
          <p className="text-[hsl(var(--muted-foreground))]">Manage taxonomy and site structure.</p>
          {!isAdmin && (
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Only admins can delete categories; editors can create and edit.
            </p>
          )}
        </div>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="bg-[hsl(var(--admin-accent))] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> New Category
          </button>
        )}
      </div>

      {creating && (
        <CategoryForm onSave={create} onCancel={() => setCreating(false)} />
      )}
      {editing && (
        <CategoryForm initial={editing} onSave={update} onCancel={() => setEditing(null)} />
      )}

      <div className="admin-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : items.length === 0 ? (
          <EmptyState title="No categories" description="Create your first category." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[hsl(var(--admin-hover))] border-b border-[hsl(var(--admin-border))] text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Slug</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--admin-border))]">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[hsl(var(--muted-foreground))]">{c.slug}</td>
                  <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] max-w-xs truncate">{c.description}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(c)} className="p-1.5 hover:text-[hsl(var(--admin-accent))]">
                        <Edit className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => remove(c.id)} className="p-1.5 hover:text-[hsl(var(--admin-error))]">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default CategoriesPage;
