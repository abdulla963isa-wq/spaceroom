'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role !== 'admin') {
      router.replace(role === 'owner' ? '/owner' : '/login');
    }
  }, [role, loading, router]);

  if (loading) return <PageLoader />;
  if (role !== 'admin') return <PageLoader />;

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
