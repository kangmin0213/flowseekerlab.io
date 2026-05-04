
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import FormField from '@/components/admin/FormField.jsx';
import LoadingSpinner from '@/components/admin/LoadingSpinner.jsx';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Navigation is handled automatically or we push them to their desired route
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null; // Avoid flashing login form while redirecting

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--admin-bg))] px-4">
      <div className="w-full max-w-md admin-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">FlowSeeker Lab</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Sign in to the admin dashboard</p>
          <p className="mt-4 text-left text-xs text-[hsl(var(--muted-foreground))] leading-relaxed rounded-md border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-hover))/30] px-3 py-2">
            <span className="font-semibold text-[hsl(var(--admin-text))]">한국어 안내 · </span>
            글을 쓰려면 먼저 아래에서 로그인한 다음, 왼쪽 메뉴에서 <strong>Posts</strong>를 누른 뒤 <strong>New Post</strong>를 누르세요.
            주소창에 직접 <code className="text-[11px]">/admin/posts/new</code>를 치면 로그인이 안 된 경우 홈처럼 보일 수 있습니다. 서버에 <code className="text-[11px]">.htaccess</code> 파일이 같이 올라가 있는지도 확인하세요.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-[hsl(var(--admin-error))/10] text-[hsl(var(--admin-error))] text-sm border border-[hsl(var(--admin-error))/20]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Email Address">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input bg-[hsl(var(--admin-sidebar-bg))] text-[hsl(var(--admin-text))]"
              required
              autoComplete="email"
              placeholder="you@flowseekerlab.io"
            />
          </FormField>

          <FormField label="Password">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input bg-[hsl(var(--admin-sidebar-bg))] text-[hsl(var(--admin-text))]"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </FormField>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-[hsl(var(--muted-foreground))]">
              <input type="checkbox" className="rounded border-border text-[hsl(var(--admin-accent))] focus:ring-[hsl(var(--admin-accent))]" />
              Remember me
            </label>
            <button type="button" className="text-[hsl(var(--admin-accent))] hover:underline font-medium">
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-6 w-full bg-[hsl(var(--admin-text))] text-[hsl(var(--admin-bg))] py-2.5 rounded-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="sm" className="text-[hsl(var(--admin-bg))]" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
