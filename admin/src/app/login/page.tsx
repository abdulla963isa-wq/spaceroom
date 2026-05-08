'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, role } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Role is set by AuthContext; wait briefly for userProfile to load
      // Redirect based on role will happen via root page or we read from context
      toast.success('Signed in successfully!');
      // Give AuthContext a moment to update role
      setTimeout(() => {
        if (role === 'admin') {
          router.replace('/admin');
        } else if (role === 'owner') {
          router.replace('/owner');
        } else {
          router.replace('/');
        }
      }, 500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      if (msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password.');
      } else if (msg.includes('too-many-requests')) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-dim border border-primary/20 mb-4">
            <span className="text-primary text-2xl font-bold">SR</span>
          </div>
          <h1 className="text-3xl font-bold text-white">SpaceRoom</h1>
          <p className="text-text-muted mt-1 text-sm">Admin & Owner Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@spaceroom.com"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface2 border border-border rounded-xl px-4 py-3 pr-12 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-bg font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg/30 border-t-bg rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Info note */}
          <div className="mt-6 p-3 bg-surface2 rounded-xl border border-border">
            <p className="text-text-muted text-xs text-center leading-relaxed">
              This dashboard is for administrators and space owners only.
              <br />
              Contact your administrator to get access.
            </p>
          </div>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          © {new Date().getFullYear()} SpaceRoom. All rights reserved.
        </p>
      </div>
    </div>
  );
}
