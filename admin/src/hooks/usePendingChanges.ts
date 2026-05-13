'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function usePendingChanges() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'pendingChanges'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;

      // Don't toast on the initial load — only on subsequent increases
      if (prevCountRef.current !== null && count > prevCountRef.current) {
        const diff = count - prevCountRef.current;
        toast(`${diff} new approval request${diff > 1 ? 's' : ''} pending`, {
          icon: '📋',
          duration: 6000,
          style: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px' },
        });
      }

      prevCountRef.current = count;
      setPendingCount(count);
    });

    return () => unsub();
  }, [user]);

  return { pendingCount };
}
