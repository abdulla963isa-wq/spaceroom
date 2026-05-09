'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNewBookingAlert } from '@/hooks/useNewBookingAlert';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import { PageLoader } from '@/components/ui/LoadingSpinner';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { role, loading, user } = useAuth();
  const router = useRouter();

  useNewBookingAlert(user?.uid ?? null);

  useEffect(() => {
    if (!loading && role !== 'owner') {
      router.replace(role === 'admin' ? '/admin' : '/login');
    }
  }, [role, loading, router]);

  if (loading) return <PageLoader />;
  if (role !== 'owner') return <PageLoader />;

  return (
    <div className="min-h-screen bg-bg">
      <OwnerSidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
