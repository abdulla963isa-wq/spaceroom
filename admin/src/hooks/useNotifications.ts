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
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until both user and role are resolved before subscribing.
    // role starts as null and loads async — subscribing before it's ready
    // would create a query with the wrong filter.
    if (!user || role === null) {
      setNotifications([]);
      setLoading(role === null && !!user); // still loading if user is set but role hasn't arrived
      return;
    }

    // Admin sees all admin-role notifications; everyone else sees only their own
    const q = role === 'admin'
      ? query(collection(db, 'notifications'), where('receiverRole', '==', 'admin'), limit(100))
      : query(collection(db, 'notifications'), where('receiverId', '==', user.uid), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Notification))
          .sort((a, b) => {
            const aTime = a.createdAt != null && typeof a.createdAt === 'object' && 'toDate' in a.createdAt
              ? (a.createdAt as { toDate: () => Date }).toDate().getTime()
              : a.createdAt ? new Date(a.createdAt as string).getTime() : 0;
            const bTime = b.createdAt != null && typeof b.createdAt === 'object' && 'toDate' in b.createdAt
              ? (b.createdAt as { toDate: () => Date }).toDate().getTime()
              : b.createdAt ? new Date(b.createdAt as string).getTime() : 0;
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
  }, [user, role]); // role must be in deps — it loads async after user

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, loading };
}
