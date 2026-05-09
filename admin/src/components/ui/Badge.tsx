'use client';

import { cn } from '@/lib/utils';

type BadgeStatus =
  | 'Confirmed'
  | 'Cancelled'
  | 'Completed'
  | 'active'
  | 'inactive'
  | 'admin'
  | 'owner'
  | 'customer'
  | string;

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  Confirmed: {
    label: 'Confirmed',
    className: 'text-success bg-success/10 border-success/20',
  },
  Cancelled: {
    label: 'Cancelled',
    className: 'text-danger bg-danger/10 border-danger/20',
  },
  Blocked: {
    label: 'Slot Blocked',
    className: 'text-warning bg-warning/10 border-warning/20',
  },
  Completed: {
    label: 'Completed',
    className: 'text-primary bg-primary-dim border-primary/20',
  },
  active: {
    label: 'Active',
    className: 'text-success bg-success/10 border-success/20',
  },
  inactive: {
    label: 'Inactive',
    className: 'text-text-muted bg-surface2 border-border',
  },
  admin: {
    label: 'Admin',
    className: 'text-primary bg-primary-dim border-primary/20',
  },
  owner: {
    label: 'Owner',
    className: 'text-warning bg-warning/10 border-warning/20',
  },
  customer: {
    label: 'Customer',
    className: 'text-text-secondary bg-surface2 border-border',
  },
};

export default function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'text-text-muted bg-surface2 border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
