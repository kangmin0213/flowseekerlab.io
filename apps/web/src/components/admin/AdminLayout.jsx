
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Tags,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Image as ImageIcon,
  Hash,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AdminToast from './Toast.jsx';

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Posts', path: '/admin/posts', icon: FileText },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Tags', path: '/admin/tags', icon: Hash },
    { name: 'Comments', path: '/admin/comments', icon: MessageSquare },
    { name: 'Media', path: '/admin/media', icon: ImageIcon },
    { name: 'Users', path: '/admin/users', icon: Users, adminOnly: true },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getPageTitle = () => {
    const item = navItems.find(item => pathname.startsWith(item.path));
    return item ? item.name : 'Admin';
  };

  return (
    <div className="admin-panel flex h-screen overflow-hidden">
      <AdminToast />
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[hsl(var(--admin-sidebar-bg))] border-r border-[hsl(var(--admin-border))]
        transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--admin-border))]">
          <span className="font-serif text-xl font-bold">FlowSeeker CMS</span>
          <button className="ml-auto md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            if (item.adminOnly && currentUser?.role !== 'admin') return null;
            
            const isActive = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[hsl(var(--admin-accent))/10] text-[hsl(var(--admin-accent))]' 
                    : 'text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--admin-hover))]'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[hsl(var(--admin-border))]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-accent))] text-white flex items-center justify-center text-xs font-bold uppercase">
              {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{currentUser?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-[hsl(var(--admin-error))] hover:bg-[hsl(var(--admin-error))/10] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-[hsl(var(--admin-sidebar-bg))] border-b border-[hsl(var(--admin-border))] flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold hidden sm:block">{getPageTitle()}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
