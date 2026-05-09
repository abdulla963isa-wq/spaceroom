'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, Space, Venue } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { subDays, isAfter, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import BookingChart from '@/components/charts/BookingChart';
import RevenueChart from '@/components/charts/RevenueChart';
import SpacePopularityChart from '@/components/charts/SpacePopularityChart';
import { CalendarCheck, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { formatCurrency, groupByMonth } from '@/lib/utils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

type DateRange = '7d' | '30d' | '90d';

export default function OwnerAnalyticsPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  useEffect(() => {
    if (!user) return;
    const venuesQuery = query(collection(db, 'venues'), where('ownerId', '==', user.uid));
    const unsubVenues = onSnapshot(venuesQuery, (snapshot) => {
      const venueList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
      setVenues(venueList);
      if (venueList.length === 0) { setLoading(false); return; }

      const venueIds = venueList.map((v) => v.id);

      const spacesQ = query(collection(db, 'spaces'));
      onSnapshot(spacesQ, (sSnap) => {
        setSpaces(sSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Space)).filter((s) => venueIds.includes(s.venueId)));
      });

      const bookingsQ = query(collection(db, 'bookings'), where('venueId', 'in', venueIds.slice(0, 10)));
      const unsubBookings = onSnapshot(bookingsQ, (bSnap) => {
        setBookings(bSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking)));
        setLoading(false);
      });
      return () => unsubBookings();
    });
    return () => unsubVenues();
  }, [user]);

  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

  const filteredBookings = useMemo(() => {
    const cutoff = subDays(new Date(), days);
    return bookings.filter((b) => {
      const date = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date();
      return isAfter(date, cutoff);
    });
  }, [bookings, days]);

  const confirmed = filteredBookings.filter((b) => b.status === 'Confirmed');
  const totalRevenue = confirmed.reduce((s, b) => s + (b.total || 0), 0);
  const avgValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;

  const bookingChartData = useMemo(() => {
    const now = new Date();
    const dateMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dateMap[format(d, 'MMM dd')] = 0;
    }
    filteredBookings.forEach((b) => {
      const date = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date();
      const key = format(date, 'MMM dd');
      if (key in dateMap) dateMap[key]++;
    });
    return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
  }, [filteredBookings, days]);

  const revenueChartData = groupByMonth(
    confirmed as Array<{ createdAt: Timestamp | string | Date; total?: number }>, 6
  );

  const spacePopData = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    filteredBookings.forEach((b) => {
      if (!map[b.spaceId]) map[b.spaceId] = { name: b.spaceName, count: 0 };
      map[b.spaceId].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5).map((d) => ({ name: d.name, bookings: d.count }));
  }, [filteredBookings]);

  // Revenue by space (for pie chart)
  const revenueBySpace = useMemo(() => {
    const map: Record<string, { name: string; revenue: number }> = {};
    confirmed.forEach((b) => {
      if (!map[b.spaceId]) map[b.spaceId] = { name: b.spaceName, revenue: 0 };
      map[b.spaceId].revenue += b.total || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [confirmed]);

  const COLORS = ['#12CFFF', '#10B981', '#F59E0B', '#FF4D4D', '#8B5CF6'];

  const rangeOptions: { label: string; value: DateRange }[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Analytics" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dateRange === opt.value ? 'bg-primary text-bg' : 'bg-surface2 border border-border text-text-secondary hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Bookings" value={filteredBookings.length} icon={<CalendarCheck size={20} />} color="primary" loading={loading} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign size={20} />} color="success" loading={loading} />
          <StatCard title="Avg Value" value={formatCurrency(avgValue)} icon={<TrendingUp size={20} />} color="warning" loading={loading} />
          <StatCard title="My Spaces" value={spaces.length} icon={<BarChart3 size={20} />} color="primary" loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BookingChart data={bookingChartData} title={`Daily Bookings (Last ${days} Days)`} />
          <RevenueChart data={revenueChartData} title="Monthly Revenue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SpacePopularityChart data={spacePopData} title="Top Spaces by Bookings" />
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Revenue by Space</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenueBySpace}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {revenueBySpace.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatCurrency(v as number)}
                  contentStyle={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: '12px', color: '#F5F5F5' }}
                  labelStyle={{ color: '#BDBDBD' }}
                  itemStyle={{ color: '#F5F5F5' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
