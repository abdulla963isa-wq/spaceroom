'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { RevenueDataPoint } from '@/types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
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
        <p className="text-white font-semibold text-sm">BHD {payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data, title = 'Monthly Revenue' }: RevenueChartProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#12CFFF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#12CFFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#2A2A2A" />
          <XAxis
            dataKey="month"
            tick={{ fill: '#888888', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#888888', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2A2A2A' }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#12CFFF"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
