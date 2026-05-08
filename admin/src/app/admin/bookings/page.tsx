'use client';

import { useState, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCollection } from '@/hooks/useFirestore';
import { Booking, User } from '@/types';
import { cancelBooking } from '@/lib/firestore';
import Header from '@/components/layout/Header';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import { Search, Download, CalendarCheck, Eye, XCircle, User as UserIcon, Mail, Phone } from 'lucide-react';
import { formatCurrency, formatDate, truncateId } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function AdminBookingsPage() {
  const { data: bookings, loading } = useCollection<Booking>('bookings');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [cancelBookingItem, setCancelBookingItem] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const openBookingDetail = async (booking: Booking) => {
    setViewBooking(booking);
    setViewUser(null);
    setUserLoading(true);
    try {
      const snap = await getDoc(doc(db, 'users', booking.userId));
      if (snap.exists()) {
        setViewUser({ id: snap.id, ...snap.data() } as User);
      }
    } catch {
      // user doc may not exist for mobile-only users
    } finally {
      setUserLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch = !search ||
        b.spaceName?.toLowerCase().includes(search.toLowerCase()) ||
        b.venueName?.toLowerCase().includes(search.toLowerCase()) ||
        b.userId?.toLowerCase().includes(search.toLowerCase()) ||
        b.id?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || b.status === statusFilter;
      const matchDateFrom = !dateFrom || b.date >= dateFrom;
      const matchDateTo = !dateTo || b.date <= dateTo;
      return matchSearch && matchStatus && matchDateFrom && matchDateTo;
    });
  }, [bookings, search, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const sorted = [...filtered].sort((a, b) => {
    const aTime = typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
    const bTime = typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
    return bTime - aTime;
  });
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCancel = async () => {
    if (!cancelBookingItem) return;
    setActionLoading(true);
    try {
      await cancelBooking(
        cancelBookingItem.id,
        cancelBookingItem.userId,
        cancelBookingItem.spaceName,
        cancelBookingItem.date
      );
      toast.success('Booking cancelled and user notified.');
      setCancelBookingItem(null);
    } catch {
      toast.error('Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Space', 'Venue', 'User ID', 'Date', 'Start', 'End', 'Duration', 'Total', 'Status'];
    const rows = filtered.map((b) => [
      b.id,
      b.spaceName,
      b.venueName,
      b.userId,
      b.date,
      b.startTime,
      b.endTime,
      b.duration,
      b.total,
      b.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported.');
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'id', label: 'ID', render: (v) => <span className="font-mono text-xs text-text-muted">{truncateId(v as string)}</span> },
    {
      key: 'spaceName', label: 'Space',
      render: (v, row) => (
        <div>
          <p className="text-white font-medium text-sm">{v as string}</p>
          <p className="text-text-muted text-xs">{(row as unknown as Booking).venueName}</p>
        </div>
      ),
    },
    { key: 'userId', label: 'User', render: (v) => <span className="font-mono text-xs">{(v as string)?.slice(0, 8)}...</span> },
    { key: 'date', label: 'Date', render: (v) => formatDate(v as string) },
    {
      key: 'startTime', label: 'Time',
      render: (v, row) => `${v} – ${(row as unknown as Booking).endTime}`,
    },
    { key: 'duration', label: 'Hrs', render: (v) => `${v}h` },
    {
      key: 'total', label: 'Total',
      render: (v) => <span className="text-success font-semibold">{formatCurrency(v as number)}</span>,
    },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v as string} /> },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => {
        const booking = row as unknown as Booking;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openBookingDetail(booking)}
              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all"
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {booking.status === 'Confirmed' && (
              <button
                onClick={() => setCancelBookingItem(booking)}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
                title="Cancel Booking"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Bookings" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-surface2 border border-border rounded-xl text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
              placeholder="To"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface2 border border-border text-text-secondary text-sm rounded-xl hover:bg-surface hover:text-white transition-all whitespace-nowrap"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

        <div className="text-text-muted text-sm">{filtered.length} bookings found</div>

        <DataTable
          columns={columns}
          data={paginated as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No bookings found."
          emptyIcon={<CalendarCheck size={32} />}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* View Details Modal */}
      <Modal isOpen={!!viewBooking} onClose={() => { setViewBooking(null); setViewUser(null); }} title="Booking Details">
        {viewBooking && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="bg-surface2 rounded-xl p-4 border border-border">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-3">Customer</p>
              {userLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-border animate-pulse" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-border rounded animate-pulse w-32" />
                    <div className="h-3 bg-border rounded animate-pulse w-48" />
                  </div>
                </div>
              ) : viewUser ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <UserIcon size={16} className="text-primary" />
                    </div>
                    <span className="text-white font-semibold">{viewUser.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary pl-1">
                    <Mail size={13} className="text-text-muted flex-shrink-0" />
                    <span>{viewUser.email}</span>
                  </div>
                  {viewUser.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary pl-1">
                      <Phone size={13} className="text-text-muted flex-shrink-0" />
                      <span>{viewUser.phoneNumber}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-text-muted text-sm">User profile not found — ID: <span className="font-mono">{viewBooking.userId.slice(0, 12)}…</span></p>
              )}
            </div>

            {/* Booking Info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Booking ID', value: truncateId(viewBooking.id) },
                { label: 'Status', value: <Badge status={viewBooking.status} /> },
                { label: 'Space', value: viewBooking.spaceName },
                { label: 'Venue', value: viewBooking.venueName },
                { label: 'Location', value: viewBooking.location },
                { label: 'Date', value: formatDate(viewBooking.date) },
                { label: 'Start Time', value: viewBooking.startTime },
                { label: 'End Time', value: viewBooking.endTime },
                { label: 'Duration', value: `${viewBooking.duration} hour(s)` },
                { label: 'Price/hr', value: formatCurrency(viewBooking.pricePerHour) },
                { label: 'Total', value: <span className="text-success font-bold">{formatCurrency(viewBooking.total)}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface2 rounded-xl p-3">
                  <p className="text-text-muted text-xs mb-1">{label}</p>
                  <div className="text-white text-sm font-medium">{value}</div>
                </div>
              ))}
            </div>

            {viewBooking.reservedSlots?.length > 0 && (
              <div className="bg-surface2 rounded-xl p-3">
                <p className="text-text-muted text-xs mb-2">Reserved Slots</p>
                <div className="flex flex-wrap gap-2">
                  {viewBooking.reservedSlots.map((slot) => (
                    <span key={slot} className="px-2 py-1 bg-primary-dim text-primary text-xs rounded-lg">{slot}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Confirm */}
      <ConfirmModal
        isOpen={!!cancelBookingItem}
        onClose={() => setCancelBookingItem(null)}
        onConfirm={handleCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for "${cancelBookingItem?.spaceName}" on ${cancelBookingItem?.date}? The user will be notified.`}
        confirmLabel="Cancel Booking"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
