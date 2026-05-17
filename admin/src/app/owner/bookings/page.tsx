'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Venue, User } from '@/types';
import { cancelBooking, getDocById } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import CancelBookingModal from '@/components/ui/CancelBookingModal';
import Pagination from '@/components/ui/Pagination';
import { CalendarCheck, Eye, XCircle, User as UserIcon, Mail, Phone } from 'lucide-react';
import { formatCurrency, formatDate, truncateId } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;
type Tab = 'upcoming' | 'past' | 'all';

export default function OwnerBookingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('bookingId');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [cancelItem, setCancelItem] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const venuesQuery = query(collection(db, 'venues'), where('ownerId', '==', user.uid));
    const unsubVenues = onSnapshot(venuesQuery, (snapshot) => {
      const venueList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
      setVenues(venueList);
      if (venueList.length === 0) { setBookings([]); setLoading(false); return; }

      const venueIds = venueList.slice(0, 10).map((v) => v.id);
      const bookingsQuery = query(collection(db, 'bookings'), where('venueId', 'in', venueIds));
      const unsubBookings = onSnapshot(bookingsQuery, (bSnapshot) => {
        setBookings(bSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
        setLoading(false);
      });
      return () => unsubBookings();
    });
    return () => unsubVenues();
  }, [user]);

  // Auto-open booking modal when navigated from a notification
  useEffect(() => {
    if (!highlightId || loading || bookings.length === 0) return;
    const target = bookings.find((b) => b.id === highlightId);
    if (target) setViewBooking(target);
  }, [highlightId, bookings, loading]);

  // Fetch customer details when a booking modal is opened
  useEffect(() => {
    if (!viewBooking) { setViewUser(null); return; }
    setUserLoading(true);
    getDocById('users', viewBooking.userId)
      .then((data) => setViewUser(data as User | null))
      .catch(() => setViewUser(null))
      .finally(() => setUserLoading(false));
  }, [viewBooking]);

  const now = new Date();
  const filtered = useMemo(() => {
    const real = bookings.filter((b) => !b.isOwnerBlock);
    let list = real;
    if (activeTab === 'upcoming') {
      list = real.filter((b) => b.status === 'Confirmed' && new Date(b.date) >= now);
    } else if (activeTab === 'past') {
      list = real.filter((b) => new Date(b.date) < now || b.status === 'Cancelled');
    }
    return [...list].sort((a, b) => {
      const at = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : 0;
      const bt = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : 0;
      return bt - at;
    });
  }, [bookings, activeTab]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCancel = async (restoreSlot: boolean) => {
    if (!cancelItem) return;
    setActionLoading(true);
    try {
      await cancelBooking(cancelItem.id, cancelItem.userId, cancelItem.spaceName, cancelItem.date, restoreSlot, 'owner');
      toast.success(
        restoreSlot
          ? 'Booking cancelled — slot restored for rebooking.'
          : 'Booking cancelled — slot blocked.'
      );
      setCancelItem(null);
    } catch {
      toast.error('Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-text-muted">{truncateId(v as string)}</span> },
    { key: 'spaceName', label: 'Space', render: (v) => <span className="text-white font-medium">{v as string}</span> },
    { key: 'userId', label: 'User', render: (v) => <span className="font-mono text-xs">{(v as string)?.slice(0, 8)}...</span> },
    { key: 'date', label: 'Date', render: (v) => formatDate(v as string) },
    { key: 'startTime', label: 'Time', render: (v, row) => `${v} – ${(row as unknown as Booking).endTime}` },
    { key: 'total', label: 'Total', render: (v) => <span className="text-success font-semibold">{formatCurrency(v as number)}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v as string} /> },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => {
        const b = row as unknown as Booking;
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => setViewBooking(b)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all">
              <Eye size={14} />
            </button>
            {b.status === 'Confirmed' && (
              <button onClick={() => setCancelItem(b)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all">
                <XCircle size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Bookings" />
      <div className="p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-text-muted border-transparent hover:text-text-secondary'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-text-muted text-sm">{filtered.length} bookings</div>

        <DataTable
          columns={columns}
          data={paginated as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No bookings found."
          emptyIcon={<CalendarCheck size={32} />}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details">
        {viewBooking && (
          <div className="space-y-4">
            {/* Customer card */}
            <div className="bg-surface2 border border-border rounded-2xl p-4">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-3">Customer</p>
              {userLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                  <div className="skeleton h-3 w-36 rounded" />
                </div>
              ) : viewUser ? (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-dim flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {viewUser.fullName?.charAt(0)?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-white font-semibold text-sm">{viewUser.fullName}</p>
                    <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                      <Mail size={11} className="text-text-muted" />
                      {viewUser.email}
                    </div>
                    {viewUser.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                        <Phone size={11} className="text-text-muted" />
                        {viewUser.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <UserIcon size={14} />
                  <span className="font-mono text-xs">{viewBooking.userId}</span>
                </div>
              )}
            </div>

            {/* Booking details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Booking ID', value: <span className="font-mono text-xs break-all">{viewBooking.id}</span> },
                { label: 'Status', value: <Badge status={viewBooking.status} /> },
                { label: 'Space', value: viewBooking.spaceName },
                { label: 'Venue', value: viewBooking.venueName },
                { label: 'Date', value: formatDate(viewBooking.date) },
                { label: 'Time', value: `${viewBooking.startTime} – ${viewBooking.endTime}` },
                { label: 'Duration', value: `${viewBooking.duration}h` },
                { label: 'Total', value: <span className="text-success font-bold">{formatCurrency(viewBooking.total)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface2 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">{label}</p>
                  <div className="text-white text-sm">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <CancelBookingModal
        isOpen={!!cancelItem}
        spaceName={cancelItem?.spaceName}
        date={cancelItem?.date}
        loading={actionLoading}
        onClose={() => setCancelItem(null)}
        onConfirm={handleCancel}
      />
    </div>
  );
}
