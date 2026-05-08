import { clsx, type ClassValue } from 'clsx';
import { format, parseISO } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return `BHD ${amount.toFixed(2)}`;
}

export function formatDate(date: string | Timestamp | Date | null | undefined): string {
  if (!date) return '—';
  try {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'MMM dd, yyyy');
    }
    if (date instanceof Date) {
      return format(date, 'MMM dd, yyyy');
    }
    if (typeof date === 'string') {
      return format(parseISO(date), 'MMM dd, yyyy');
    }
    return '—';
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Timestamp | Date | null | undefined): string {
  if (!date) return '—';
  try {
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'MMM dd, yyyy HH:mm');
    }
    if (date instanceof Date) {
      return format(date, 'MMM dd, yyyy HH:mm');
    }
    if (typeof date === 'string') {
      return format(parseISO(date), 'MMM dd, yyyy HH:mm');
    }
    return '—';
  } catch {
    return String(date);
  }
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'text-success bg-success/10 border border-success/20';
    case 'cancelled':
      return 'text-danger bg-danger/10 border border-danger/20';
    case 'completed':
      return 'text-primary bg-primary-dim border border-primary/20';
    case 'active':
      return 'text-success bg-success/10 border border-success/20';
    case 'inactive':
      return 'text-text-muted bg-surface2 border border-border';
    case 'admin':
      return 'text-primary bg-primary-dim border border-primary/20';
    case 'owner':
      return 'text-warning bg-warning/10 border border-warning/20';
    case 'customer':
      return 'text-text-secondary bg-surface2 border border-border';
    default:
      return 'text-text-muted bg-surface2 border border-border';
  }
}

export function truncateId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function groupByDate(
  items: Array<{ createdAt: Timestamp | string | Date }>,
  days: number = 30
): Array<{ date: string; count: number }> {
  const now = new Date();
  const dateMap: Record<string, number> = {};

  // Initialize all dates in range
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = format(d, 'MMM dd');
    dateMap[key] = 0;
  }

  items.forEach((item) => {
    try {
      let date: Date;
      if (item.createdAt instanceof Timestamp) {
        date = item.createdAt.toDate();
      } else if (item.createdAt instanceof Date) {
        date = item.createdAt;
      } else if (typeof item.createdAt === 'string') {
        date = parseISO(item.createdAt);
      } else {
        return;
      }

      const diffTime = now.getTime() - date.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays <= days) {
        const key = format(date, 'MMM dd');
        if (key in dateMap) {
          dateMap[key]++;
        }
      }
    } catch {
      // skip
    }
  });

  return Object.entries(dateMap).map(([date, count]) => ({ date, count }));
}

export function groupByMonth(
  items: Array<{ createdAt: Timestamp | string | Date; total?: number }>,
  months: number = 6
): Array<{ month: string; revenue: number }> {
  const now = new Date();
  const monthMap: Record<string, number> = {};

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = format(d, 'MMM yyyy');
    monthMap[key] = 0;
  }

  items.forEach((item) => {
    try {
      let date: Date;
      if (item.createdAt instanceof Timestamp) {
        date = item.createdAt.toDate();
      } else if (item.createdAt instanceof Date) {
        date = item.createdAt;
      } else if (typeof item.createdAt === 'string') {
        date = parseISO(item.createdAt);
      } else {
        return;
      }

      const key = format(date, 'MMM yyyy');
      if (key in monthMap) {
        monthMap[key] += item.total || 0;
      }
    } catch {
      // skip
    }
  });

  return Object.entries(monthMap).map(([month, revenue]) => ({ month, revenue }));
}
