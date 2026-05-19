'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Space, Venue, User } from '@/types';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import BookingChart from '@/components/charts/BookingChart';
import RevenueChart from '@/components/charts/RevenueChart';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import {
  Users, Building2, Grid3X3, CalendarCheck, DollarSign, CheckCircle, Trophy,
} from 'lucide-react';
import { formatCurrency, formatDate, groupByDate, groupByMonth } from '@/lib/utils';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    unsubs.push(onSnapshot(collection(db, 'users'), (s) => {
      setUsers(s.docs.map((d) => ({ id: d.id, ...d.data() } as User)));
    }));
    unsubs.push(onSnapshot(collection(db, 'bookings'), (s) => {
      setBookings(s.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
      setLoading(false);
    }));
    unsubs.push(onSnapshot(collection(db, 'venues'), (s) => {
      setVenues(s.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
    }));
    unsubs.push(onSnapshot(collection(db, 'spaces'), (s) => {
      setSpaces(s.docs.map((d) => ({ id: d.id, ...d.data() } as Space)));
    }));

    return () => unsubs.forEach((u) => u());
  }, []);

  const realBookings = bookings.filter((b) => !b.isOwnerBlock);
  const confirmedBookings = realBookings.filter((b) => b.status === 'Confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  const activeListings = spaces.filter((s) => s.isActive).length;
  const recentBookings = [...realBookings]
    .sort((a, b) => {
      const aTime = typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? a.createdAt.toDate().getTime() : 0;
      const bTime = typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  // Top spaces by bookings
  const spaceBookingMap: Record<string, { name: string; count: number }> = {};
  realBookings.forEach((b) => {
    if (!spaceBookingMap[b.spaceId]) {
      const displayName = b.venueName ? `${b.venueName} — ${b.spaceName}` : b.spaceName;
      spaceBookingMap[b.spaceId] = { name: displayName, count: 0 };
    }
    spaceBookingMap[b.spaceId].count++;
  });
  const topSpaces = Object.entries(spaceBookingMap)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostBookedSpace = topSpaces[0] ?? null;
  const mostBookedPct = mostBookedSpace && bookings.length > 0
    ? Math.round((mostBookedSpace.count / bookings.length) * 100)
    : 0;

  const bookingChartData = groupByDate(bookings as Array<{ createdAt: import('firebase/firestore').Timestamp | string | Date }>, 30);
  const revenueChartData = groupByMonth(
    confirmedBookings as Array<{ createdAt: import('firebase/firestore').Timestamp | string | Date; total?: number }>,
    6
  );

  const bookingColumns = [
    { key: 'spaceName', label: 'Space' },
    { key: 'venueName', label: 'Venue' },
    { key: 'date', label: 'Date', render: (v: unknown) => formatDate(v as string) },
    { key: 'total', label: 'Total', render: (v: unknown) => formatCurrency(v as number) },
    {
      key: 'status', label: 'Status',
      render: (v: unknown) => <Badge status={v as string} />,
    },
  ];

  const topSpaceColumns = [
    { key: 'name', label: 'Space Name' },
    { key: 'count', label: 'Bookings', render: (v: unknown) => <span className="text-primary font-semibold">{v as number}</span> },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Users" value={users.length} icon={<Users size={20} />} color="primary" loading={loading} />
          <StatCard title="Total Bookings" value={bookings.length} icon={<CalendarCheck size={20} />} color="primary" loading={loading} />
          <StatCard title="Total Venues" value={venues.length} icon={<Building2 size={20} />} color="success" loading={loading} />
          <StatCard title="Total Spaces" value={spaces.length} icon={<Grid3X3 size={20} />} color="warning" loading={loading} />
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign size={20} />} color="success" loading={loading} />
          <StatCard title="Active Listings" value={activeListings} icon={<CheckCircle size={20} />} color="success" loading={loading} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BookingChart data={bookingChartData} title="Daily Bookings (Last 30 Days)" />
          <RevenueChart data={revenueChartData} title="Monthly Revenue (Last 6 Months)" />
        </div>

        {/* Most Booked Space Highlight */}
        {mostBookedSpace && (
          <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <Trophy size={26} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-muted text-xs font-semibold uppercase tracking-widest mb-1">Most Booked Space</p>
              <p className="text-white text-xl font-bold truncate">{mostBookedSpace.name}</p>
              <p className="text-text-secondary text-sm mt-0.5">
                <span className="text-warning font-semibold">{mostBookedSpace.count}</span>{' '}bookings —&nbsp;
                <span className="text-text-muted">{mostBookedPct}% of all platform bookings</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-right hidden sm:block">
              <p className="text-warning text-3xl font-black">#{1}</p>
              <p className="text-text-muted text-xs">Top Ranked</p>
            </div>
          </div>
        )}

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Recent Bookings</h3>
            <DataTable
              columns={bookingColumns}
              data={recentBookings as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyMessage="No bookings yet."
            />
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Top Spaces</h3>
            <DataTable
              columns={topSpaceColumns}
              data={topSpaces as unknown as Record<string, unknown>[]}
              loading={loading}
              emptyMessage="No bookings data."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
