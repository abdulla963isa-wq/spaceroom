'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (role === 'admin') {
      router.replace('/admin');
    } else if (role === 'owner') {
      router.replace('/owner');
    } else {
      router.replace('/login');
    }
  }, [role, loading, router]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
