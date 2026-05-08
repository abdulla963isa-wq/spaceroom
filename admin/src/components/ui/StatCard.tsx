'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  color?: 'primary' | 'success' | 'danger' | 'warning';
  loading?: boolean;
}

const colorMap = {
  primary: 'bg-primary-dim text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
};

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  loading = false,
}: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-3 hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-text-muted text-sm font-medium">{title}</span>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorMap[color])}>
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="skeleton h-8 w-24 rounded-lg" />
      ) : (
        <div className="text-3xl font-bold text-white">{value}</div>
      )}

      {trend && (
        <div className="text-text-muted text-xs flex items-center gap-1">
          <span className={trend.startsWith('+') ? 'text-success' : trend.startsWith('-') ? 'text-danger' : 'text-text-muted'}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
