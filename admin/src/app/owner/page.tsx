'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Venue, Space } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import BookingChart from '@/components/charts/BookingChart';
import RevenueChart from '@/components/charts/RevenueChart';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import { Building2, Grid3X3, CalendarCheck, DollarSign, Clock, XCircle } from 'lucide-react';
import { formatCurrency, formatDate, groupByDate, groupByMonth } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubs: (() => void)[] = [];

    // Get owner's venues
    const venuesQuery = query(collection(db, 'venues'), where('ownerId', '==', user.uid));
    unsubs.push(onSnapshot(venuesQuery, (snapshot) => {
      const venueList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
      setVenues(venueList);

      if (venueList.length === 0) {
        setSpaces([]);
        setBookings([]);
        setLoading(false);
        return;
      }

      const venueIds = venueList.map((v) => v.id);

      // Get spaces for owner's venues (scoped query avoids permission errors)
      const spacesQuery = query(collection(db, 'spaces'), where('venueId', 'in', venueIds.slice(0, 10)));
      unsubs.push(onSnapshot(spacesQuery, (sSnapshot) => {
        setSpaces(sSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Space)));
      }));

      // Get bookings for owner's venues (use first batch if > 10)
      const batchIds = venueIds.slice(0, 10);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('venueId', 'in', batchIds)
      );
      unsubs.push(onSnapshot(bookingsQuery, (bSnapshot) => {
        setBookings(bSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
        setLoading(false);
      }));
    }));

    return () => unsubs.forEach((u) => u());
  }, [user]);

  const realBookings = bookings.filter((b) => !b.isOwnerBlock);
  const confirmedBookings = realBookings.filter((b) => b.status === 'Confirmed');
  const cancelledBookings = realBookings.filter((b) => b.status === 'Cancelled');
  const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.total || 0), 0);
  const now = new Date();
  const upcomingBookings = confirmedBookings.filter((b) => new Date(b.date) >= now);

  const recentBookings = [...realBookings]
    .sort((a, b) => {
      const at = a.createdAt instanceof Timestamp ? a.createdAt.toDate().getTime() : 0;
      const bt = b.createdAt instanceof Timestamp ? b.createdAt.toDate().getTime() : 0;
      return bt - at;
    })
    .slice(0, 5);

  const bookingChartData = groupByDate(
    realBookings as Array<{ createdAt: Timestamp | string | Date }>, 30
  );
  const revenueChartData = groupByMonth(
    confirmedBookings as Array<{ createdAt: Timestamp | string | Date; total?: number }>, 6
  );

  const bookingColumns = [
    { key: 'spaceName', label: 'Space' },
    { key: 'date', label: 'Date', render: (v: unknown) => formatDate(v as string) },
    { key: 'startTime', label: 'Start' },
    { key: 'total', label: 'Total', render: (v: unknown) => formatCurrency(v as number) },
    { key: 'status', label: 'Status', render: (v: unknown) => <Badge status={v as string} /> },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="My Venues" value={venues.length} icon={<Building2 size={20} />} color="primary" loading={loading} />
          <StatCard title="My Spaces" value={spaces.length} icon={<Grid3X3 size={20} />} color="warning" loading={loading} />
          <StatCard title="Total Bookings" value={bookings.length} icon={<CalendarCheck size={20} />} color="primary" loading={loading} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign size={20} />} color="success" loading={loading} />
          <StatCard title="Upcoming" value={upcomingBookings.length} icon={<Clock size={20} />} color="warning" loading={loading} />
          <StatCard title="Cancelled" value={cancelledBookings.length} icon={<XCircle size={20} />} color="danger" loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={revenueChartData} title="My Monthly Revenue" />
          <BookingChart data={bookingChartData} title="My Daily Bookings (Last 30 Days)" />
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Bookings</h3>
          <DataTable
            columns={bookingColumns}
            data={recentBookings as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyMessage="No bookings yet."
          />
        </div>
      </div>
    </div>
  );
}
