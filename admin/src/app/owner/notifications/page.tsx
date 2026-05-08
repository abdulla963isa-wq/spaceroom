'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import { Bell, Check, CheckCheck, Info, Calendar } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Notification } from '@/types';

const typeConfig = {
  booking: { icon: Calendar, color: 'text-primary bg-primary-dim', label: 'Booking' },
  system: { icon: Info, color: 'text-warning bg-warning/10', label: 'System' },
  announcement: { icon: Bell, color: 'text-success bg-success/10', label: 'Announcement' },
};

export default function OwnerNotificationsPage() {
  const { notifications, unreadCount, loading } = useNotifications();
  const { user } = useAuth();

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
    } catch {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsRead(user.uid);
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const getConfig = (type: Notification['type']) => typeConfig[type] || typeConfig.system;

  return (
    <div className="flex flex-col flex-1">
      <Header title="Notifications" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-muted text-sm">{notifications.length} notifications</p>
            {unreadCount > 0 && (
              <p className="text-primary text-xs mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 bg-surface2 border border-border rounded-xl text-text-secondary text-sm hover:text-white transition-all"
            >
              <CheckCheck size={15} />
              Mark All Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
            <Bell size={48} className="opacity-30" />
            <div className="text-center">
              <p className="font-medium text-white">No notifications</p>
              <p className="text-sm mt-1">You&apos;re all caught up!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = getConfig(notif.type);
              const Icon = config.icon;

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:border-border/80',
                    notif.isRead
                      ? 'bg-surface border-border'
                      : 'bg-primary-dim/20 border-primary/20'
                  )}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                >
                  <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
                    config.color
                  )}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{notif.title}</p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-text-secondary text-sm mt-1 leading-relaxed">{notif.message}</p>
                    <p className="text-text-muted text-xs mt-2">{formatDateTime(notif.createdAt)}</p>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(notif.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-primary-dim transition-all flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
