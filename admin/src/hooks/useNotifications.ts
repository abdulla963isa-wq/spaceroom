'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/types';
import { useAuth } from './useAuth';

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Notification))
          .sort((a, b) => {
            const aTime = typeof a.createdAt === 'object' && a.createdAt && 'toDate' in a.createdAt
              ? (a.createdAt as { toDate: () => Date }).toDate().getTime()
              : new Date(a.createdAt as string).getTime();
            const bTime = typeof b.createdAt === 'object' && b.createdAt && 'toDate' in b.createdAt
              ? (b.createdAt as { toDate: () => Date }).toDate().getTime()
              : new Date(b.createdAt as string).getTime();
            return bTime - aTime;
          });
        setNotifications(notifs);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, loading };
}
