'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { Notification, User } from '@/types';
import { deleteDoc, createNotification, markAllNotificationsRead } from '@/lib/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Badge from '@/components/ui/Badge';
import { Bell, Plus, Trash2, Filter, CheckCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminNotificationsPage() {
  const { data: notifications, loading } = useCollection<Notification>('notifications');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [deleteNotif, setDeleteNotif] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [compose, setCompose] = useState({
    recipientType: 'all-users',
    specificUserId: '',
    title: '',
    message: '',
    type: 'announcement' as Notification['type'],
  });

  const filtered = useMemo(() => {
    return [...notifications]
      .sort((a, b) => {
        const at = typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
        const bt = typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      })
      .filter((n) => {
        const matchType = !typeFilter || n.type === typeFilter;
        const matchRead = readFilter === '' ? true : readFilter === 'unread' ? !n.isRead : n.isRead;
        return matchType && matchRead;
      });
  }, [notifications, typeFilter, readFilter]);

  const handleSend = async () => {
    if (!compose.title || !compose.message) {
      toast.error('Title and message are required.');
      return;
    }
    setActionLoading(true);
    try {
      if (compose.recipientType === 'specific') {
        if (!compose.specificUserId) {
          toast.error('Please enter a user ID.');
          setActionLoading(false);
          return;
        }
        await createNotification(
          compose.specificUserId,
          'customer',
          compose.title,
          compose.message,
          compose.type
        );
      } else {
        // Send to all users or all owners
        const role = compose.recipientType === 'all-owners' ? 'owner' : 'customer';
        const snapshot = await getDocs(collection(db, 'users'));
        const targets = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() } as User))
          .filter((u) => compose.recipientType === 'all' || u.role === role);

        await Promise.all(
          targets.map((u) =>
            createNotification(u.id, u.role as Notification['receiverRole'], compose.title, compose.message, compose.type)
          )
        );
      }
      toast.success('Notification(s) sent successfully.');
      setShowCompose(false);
      setCompose({ recipientType: 'all-users', specificUserId: '', title: '', message: '', type: 'announcement' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send notifications.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      // Mark ALL unread notifications as read (admin view)
      const unread = notifications.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markAllNotificationsRead(n.receiverId)));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteNotif) return;
    setActionLoading(true);
    try {
      await deleteDoc('notifications', deleteNotif.id);
      toast.success('Notification deleted.');
      setDeleteNotif(null);
    } catch {
      toast.error('Failed to delete notification.');
    } finally {
      setActionLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    booking: 'text-primary bg-primary-dim',
    system: 'text-warning bg-warning/10',
    announcement: 'text-success bg-success/10',
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Notifications" />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All Types</option>
              <option value="booking">Booking</option>
              <option value="system">System</option>
              <option value="announcement">Announcement</option>
            </select>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface2 border border-border text-text-secondary text-sm rounded-xl hover:bg-surface hover:text-white transition-all"
            >
              <CheckCheck size={16} />
              Mark All Read
            </button>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
            >
              <Plus size={16} />
              Compose
            </button>
          </div>
        </div>

        <div className="text-text-muted text-sm">{filtered.length} notifications</div>

        {/* Notification List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
            <Bell size={40} className="opacity-30" />
            <p className="text-sm">No notifications found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-colors',
                  notif.isRead
                    ? 'bg-surface border-border'
                    : 'bg-primary-dim/30 border-primary/20'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                  typeColors[notif.type] || 'text-text-muted bg-surface2'
                )}>
                  <Bell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-medium text-sm">{notif.title}</p>
                      <p className="text-text-muted text-xs mt-0.5">{notif.message}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                      <button
                        onClick={() => setDeleteNotif(notif)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge status={notif.type} />
                    <span className="text-text-muted text-xs">{formatDateTime(notif.createdAt)}</span>
                    <span className="text-text-muted text-xs">To: {notif.receiverId.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <Modal isOpen={showCompose} onClose={() => setShowCompose(false)} title="Compose Notification">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Recipients</label>
            <select
              value={compose.recipientType}
              onChange={(e) => setCompose({ ...compose, recipientType: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            >
              <option value="all">All Users</option>
              <option value="all-owners">All Owners</option>
              <option value="all-users">All Customers</option>
              <option value="specific">Specific User (by ID)</option>
            </select>
          </div>
          {compose.recipientType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">User ID</label>
              <input
                type="text"
                value={compose.specificUserId}
                onChange={(e) => setCompose({ ...compose, specificUserId: e.target.value })}
                placeholder="Firebase user UID"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
            <select
              value={compose.type}
              onChange={(e) => setCompose({ ...compose, type: e.target.value as Notification['type'] })}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            >
              <option value="announcement">Announcement</option>
              <option value="system">System</option>
              <option value="booking">Booking</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Title</label>
            <input
              type="text"
              value={compose.title}
              onChange={(e) => setCompose({ ...compose, title: e.target.value })}
              placeholder="Notification title"
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Message</label>
            <textarea
              value={compose.message}
              onChange={(e) => setCompose({ ...compose, message: e.target.value })}
              placeholder="Write your message here..."
              rows={4}
              className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface2 text-sm">Cancel</button>
            <button onClick={handleSend} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
              {actionLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteNotif}
        onClose={() => setDeleteNotif(null)}
        onConfirm={handleDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
