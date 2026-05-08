'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ChartDataPoint } from '@/types';

interface BookingChartProps {
  data: ChartDataPoint[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface2 border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-text-muted text-xs mb-1">{label}</p>
        <p className="text-white font-semibold text-sm">{payload[0].value} bookings</p>
      </div>
    );
  }
  return null;
};

export default function BookingChart({ data, title = 'Daily Bookings' }: BookingChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="#2A2A2A" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#888888', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#888888', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(18,207,255,0.05)' }} />
          <Bar dataKey="count" fill="#12CFFF" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
