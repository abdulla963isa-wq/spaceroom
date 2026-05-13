'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { Notification, User, PendingChange } from '@/types';
import {
  deleteDoc,
  createNotification,
  markAllNotificationsRead,
  markNotificationRead,
  approvePendingChange,
  rejectPendingChange,
} from '@/lib/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Badge from '@/components/ui/Badge';
import { Bell, Plus, Trash2, CheckCheck, Search, Check, X, ClipboardList } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const FIELD_LABELS: Record<string, string> = {
  name: 'Venue Name',
  location: 'Location',
  description: 'Description',
  heroImage: 'Hero Image',
  categories: 'Categories',
  latitude: 'Latitude',
  longitude: 'Longitude',
  isActive: 'Active Listing',
  title: 'Space Title',
  venueId: 'Venue',
  type: 'Type',
  capacity: 'Capacity',
  pricePerHour: 'Price/hr (BHD)',
  quantity: 'Quantity',
  image: 'Space Photo',
  tags: 'Tags',
  availabilityText: 'Availability Text',
};

function formatVal(val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ') || '—';
  return String(val) || '—';
}

export default function AdminNotificationsPage() {
  const { data: notifications, loading } = useCollection<Notification>('notifications');
  const { data: allPendingChanges } = useCollection<PendingChange>('pendingChanges');
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [deleteNotif, setDeleteNotif] = useState<Notification | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedChange, setSelectedChange] = useState<PendingChange | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  const [compose, setCompose] = useState({
    recipientType: 'all-users',
    specificUserId: '',
    title: '',
    message: '',
    type: 'announcement' as Notification['type'],
  });

  const pendingRequests = useMemo(() =>
    [...allPendingChanges]
      .filter((c) => c.status === 'pending')
      .sort((a, b) => {
        const at = a.createdAt != null && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
        const bt = b.createdAt != null && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      }),
    [allPendingChanges]
  );

  const filtered = useMemo(() => {
    return [...notifications]
      .sort((a, b) => {
        const at = a.createdAt != null && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
        const bt = b.createdAt != null && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      })
      .filter((n) => {
        const matchType = !typeFilter || n.type === typeFilter;
        const matchRead = readFilter === '' ? true : readFilter === 'unread' ? !n.isRead : n.isRead;
        const q = search.toLowerCase();
        const matchSearch = !search ||
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q);
        return n.receiverRole === 'admin' && matchType && matchRead && matchSearch;
      });
  }, [notifications, typeFilter, readFilter, search]);

  const handleApprove = async () => {
    if (!selectedChange) return;
    setApproveLoading(true);
    try {
      await approvePendingChange(selectedChange.id);
      setSelectedChange((prev) => prev ? { ...prev, status: 'approved' } : null);
      toast.success('Change approved and applied.');
    } catch {
      toast.error('Failed to approve change.');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedChange) return;
    setApproveLoading(true);
    try {
      await rejectPendingChange(selectedChange.id);
      setSelectedChange((prev) => prev ? { ...prev, status: 'rejected' } : null);
      toast.success('Change rejected.');
    } catch {
      toast.error('Failed to reject change.');
    } finally {
      setApproveLoading(false);
    }
  };

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
        await createNotification(compose.specificUserId, 'customer', compose.title, compose.message, compose.type);
      } else {
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
      const unread = filtered.filter((n) => !n.isRead);
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try { await markNotificationRead(notif.id); } catch { /* non-critical */ }
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
      <div className="p-6 space-y-6">

        {/* ── Pending Approval Requests ── */}
        {pendingRequests.length > 0 && (
          <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-warning" />
              <h3 className="text-warning font-semibold text-sm">
                Pending Approval Requests ({pendingRequests.length})
              </h3>
            </div>
            <div className="space-y-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setSelectedChange(req)}
                  className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-warning/20 cursor-pointer hover:border-warning/40 transition-colors"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {req.type === 'venue' ? 'Venue' : 'Space'} {req.action === 'create' ? 'New' : 'Edit'} — {req.entityName}
                      {req.type === 'space' && req.venueName && (
                        <span className="text-text-muted font-normal"> · {req.venueName}</span>
                      )}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">by {req.ownerName} · {formatDateTime(req.createdAt)}</p>
                  </div>
                  <span className="text-warning text-xs font-medium">Review →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notifications ── */}
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3 flex-wrap flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface2 border border-border rounded-xl text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary"
                />
              </div>
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
                  onClick={() => handleNotifClick(notif)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl border transition-colors cursor-pointer',
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
                          onClick={(e) => { e.stopPropagation(); setDeleteNotif(notif); }}
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
      </div>

      {/* Pending Change Review Modal */}
      <Modal
        isOpen={!!selectedChange}
        onClose={() => setSelectedChange(null)}
        title={selectedChange
          ? `${selectedChange.type === 'venue' ? 'Venue' : 'Space'} ${selectedChange.action === 'create' ? 'New' : 'Edit'} Request`
          : ''}
        size="lg"
      >
        {selectedChange && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border">
              <div>
                <p className="text-white font-medium text-sm">{selectedChange.entityName}</p>
                {selectedChange.type === 'space' && selectedChange.venueName && (
                  <p className="text-text-muted text-xs">Venue: {selectedChange.venueName}</p>
                )}
                <p className="text-text-muted text-xs mt-0.5">Requested by {selectedChange.ownerName}</p>
              </div>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold',
                selectedChange.status === 'pending' ? 'bg-warning/10 text-warning' :
                selectedChange.status === 'approved' ? 'bg-success/10 text-success' :
                'bg-danger/10 text-danger'
              )}>
                {selectedChange.status.charAt(0).toUpperCase() + selectedChange.status.slice(1)}
              </span>
            </div>

            {/* Diff for edits */}
            {selectedChange.action === 'edit' && selectedChange.changes && (
              <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">Requested Changes</p>
                <div className="space-y-2">
                  {Object.entries(selectedChange.changes).map(([field, { from, to }]) => (
                    <div key={field} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl border border-border text-sm">
                      <span className="text-text-muted w-32 flex-shrink-0">{FIELD_LABELS[field] || field}</span>
                      <span className="text-danger line-through flex-1">{formatVal(from)}</span>
                      <span className="text-text-muted mx-1">→</span>
                      <span className="text-success flex-1">{formatVal(to)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full data for creates */}
            {selectedChange.action === 'create' && selectedChange.newData && (
              <div>
                <p className="text-text-secondary text-xs font-medium uppercase tracking-wide mb-2">
                  New {selectedChange.type === 'venue' ? 'Venue' : 'Space'} Details
                </p>
                <div className="space-y-2">
                  {Object.entries(selectedChange.newData)
                    .filter(([k]) => k !== 'ownerId' && k !== 'createdAt')
                    .map(([field, val]) => (
                      <div key={field} className="flex items-center gap-3 p-3 bg-surface2 rounded-xl border border-border text-sm">
                        <span className="text-text-muted w-32 flex-shrink-0">{FIELD_LABELS[field] || field}</span>
                        <span className="text-white flex-1">{formatVal(val)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {selectedChange.status === 'pending' ? (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleReject}
                  disabled={approveLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 text-sm font-medium disabled:opacity-50 transition-all"
                >
                  <X size={15} />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success/10 text-success border border-success/20 hover:bg-success/20 text-sm font-medium disabled:opacity-50 transition-all"
                >
                  <Check size={15} />
                  {approveLoading ? 'Applying...' : 'Approve & Apply'}
                </button>
              </div>
            ) : (
              <p className="text-center text-text-muted text-sm">
                This request has already been {selectedChange.status}.
              </p>
            )}
          </div>
        )}
      </Modal>

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
