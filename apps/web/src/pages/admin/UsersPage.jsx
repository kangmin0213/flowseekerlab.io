import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/AdminLayout.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';
import EmptyState from '@/components/admin/EmptyState.jsx';
import pb from '@/lib/pocketbaseClient.js';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await pb.collection('users').getFullList({ sort: '-created', $autoCancel: false });
      setUsers(list);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setRole = async (id, role) => {
    try {
      await pb.collection('users').update(id, { role }, { $autoCancel: false });
      toast.success(`Role updated to ${role}`);
      load();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await pb.collection('users').delete(id, { $autoCancel: false });
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold">Users</h2>
        <p className="text-[hsl(var(--muted-foreground))]">Manage authors, editors, and admins.</p>
        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))] max-w-2xl leading-relaxed">
          This screen is admin-only by design: changing roles or deleting accounts affects who can access the CMS.
          Editors should use <strong className="text-[hsl(var(--admin-text))]">Settings</strong> for their own display name,
          and <strong className="text-[hsl(var(--admin-text))]">Categories / Tags</strong> for taxonomy — not this page.
        </p>
      </div>

      <div className="admin-card p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><LoadingSpinner /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No users" description="No users registered yet." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[hsl(var(--admin-hover))] border-b border-[hsl(var(--admin-border))] text-[hsl(var(--muted-foreground))] uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Name / Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--admin-border))]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium">{u.name || '—'}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => setRole(u.id, e.target.value)}
                      className="bg-transparent border border-[hsl(var(--admin-border))] rounded-md px-2 py-1 text-xs"
                    >
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">
                    {new Date(u.created).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => remove(u.id)} className="p-1.5 hover:text-[hsl(var(--admin-error))]">
                      <Trash2 className="h-4 w-4" />
                    </button>
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

export default UsersPage;
