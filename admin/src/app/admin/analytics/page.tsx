'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { Booking } from '@/types';
import { subDays, isAfter, parseISO, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import BookingChart from '@/components/charts/BookingChart';
import RevenueChart from '@/components/charts/RevenueChart';
import SpacePopularityChart from '@/components/charts/SpacePopularityChart';
import PeakHoursChart from '@/components/charts/PeakHoursChart';
import DataTable from '@/components/ui/DataTable';
import { CalendarCheck, DollarSign, TrendingDown, BarChart3 } from 'lucide-react';
import { formatCurrency, groupByMonth } from '@/lib/utils';

type DateRange = '7d' | '30d' | '90d';

export default function AdminAnalyticsPage() {
  const { data: bookings, loading } = useCollection<Booking>('bookings');
  const { data: users } = useCollection<{ id: string; fullName: string; email: string }>('users');
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;

  const filteredBookings = useMemo(() => {
    const cutoff = subDays(new Date(), days);
    return bookings.filter((b) => {
      let date: Date;
      if (b.createdAt instanceof Timestamp) {
        date = b.createdAt.toDate();
      } else if (typeof b.createdAt === 'string') {
        try { date = parseISO(b.createdAt); } catch { return false; }
      } else {
        return false;
      }
      return isAfter(date, cutoff);
    });
  }, [bookings, days]);

  const confirmed = filteredBookings.filter((b) => b.status === 'Confirmed');
  const cancelled = filteredBookings.filter((b) => b.status === 'Cancelled');
  const totalRevenue = confirmed.reduce((s, b) => s + (b.total || 0), 0);
  const avgBookingValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;
  const cancellationRate = filteredBookings.length > 0
    ? ((cancelled.length / filteredBookings.length) * 100).toFixed(1)
    : '0.0';

  // Daily bookings chart
  const bookingChartData = useMemo(() => {
    const now = new Date();
    const dateMap: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dateMap[format(d, 'MMM dd')] = 0;
    }
    filteredBookings.forEach((b) => {
      let date: Date;
      if (b.createdAt instanceof Timestamp) date = b.createdAt.toDate();
      else if (typeof b.createdAt === 'string') { try { date = parseISO(b.createdAt); } catch { return; } }
      else return;
      const key = format(date, 'MMM dd');
      if (key in dateMap) dateMap[key]++;
    });
    return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
  }, [filteredBookings, days]);

  // Monthly revenue
  const revenueChartData = groupByMonth(
    confirmed as Array<{ createdAt: Timestamp | string | Date; total?: number }>,
    6
  );

  // Space popularity
  const spacePopData = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    filteredBookings.forEach((b) => {
      if (!map[b.spaceId]) map[b.spaceId] = { name: b.spaceName, count: 0 };
      map[b.spaceId].count++;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((d) => ({ name: d.name, bookings: d.count }));
  }, [filteredBookings]);

  // Peak hours
  const peakHoursData = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 9; h <= 18; h++) hours[h] = 0;
    filteredBookings.forEach((b) => {
      if (b.startTime) {
        const h = parseInt(b.startTime.split(':')[0]);
        if (h >= 9 && h <= 18) hours[h]++;
      }
    });
    return Object.entries(hours).map(([h, count]) => ({
      hour: `${h}:00`,
      count,
    }));
  }, [filteredBookings]);

  // Most active users
  const activeUsers = useMemo(() => {
    const userMap = new Map(users.map((u) => [u.id, u]));
    const map: Record<string, number> = {};
    filteredBookings
      .filter((b) => !b.isOwnerBlock)
      .forEach((b) => { map[b.userId] = (map[b.userId] || 0) + 1; });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => {
        const user = userMap.get(userId);
        return { name: user?.fullName || user?.email || userId, count };
      });
  }, [filteredBookings, users]);

  const rangeOptions: { label: string; value: DateRange }[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Analytics" />
      <div className="p-6 space-y-6">
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-sm">Date range:</span>
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dateRange === opt.value
                  ? 'bg-primary text-bg'
                  : 'bg-surface2 border border-border text-text-secondary hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Bookings" value={filteredBookings.length} icon={<CalendarCheck size={20} />} color="primary" loading={loading} />
          <StatCard title="Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign size={20} />} color="success" loading={loading} />
          <StatCard title="Avg Booking Value" value={formatCurrency(avgBookingValue)} icon={<BarChart3 size={20} />} color="warning" loading={loading} />
          <StatCard title="Cancellation Rate" value={`${cancellationRate}%`} icon={<TrendingDown size={20} />} color="danger" loading={loading} />
        </div>

        {/* Booking Chart Full Width */}
        <BookingChart data={bookingChartData} title={`Daily Bookings (Last ${days} Days)`} />

        {/* Revenue + Popularity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueChart data={revenueChartData} title="Monthly Revenue (Last 6 Months)" />
          <SpacePopularityChart data={spacePopData} title="Top 5 Spaces by Bookings" />
        </div>

        {/* Peak Hours */}
        <PeakHoursChart data={peakHoursData} title="Peak Booking Hours" />

        {/* Most Active Users */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Most Active Users (Top 10)</h3>
          <DataTable
            columns={[
              { key: 'name', label: 'User', render: (v) => <span className="text-white text-sm">{v as string}</span> },
              {
                key: 'count', label: 'Bookings',
                render: (v) => <span className="text-primary font-bold">{v as number}</span>,
              },
            ]}
            data={activeUsers as unknown as Record<string, unknown>[]}
            loading={loading}
            emptyMessage="No booking data available."
          />
        </div>
      </div>
    </div>
  );
}
