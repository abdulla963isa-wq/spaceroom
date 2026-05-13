'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Grid3X3,
  CalendarCheck,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Venues', href: '/admin/venues', icon: Building2 },
  { label: 'Spaces', href: '/admin/spaces', icon: Grid3X3 },
  { label: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, userProfile, logout } = useAuth();
  const { unreadCount, notifications } = useNotifications();
  const { pendingCount } = usePendingChanges();
  const totalBadge = unreadCount + pendingCount;
  const seenIds = useRef<Set<string> | null>(null);
  const seenBookingIds = useRef<Set<string> | null>(null);

  // Toast for non-booking notifications (approval results, announcements, etc.)
  // Booking toasts are handled by the live bookings listener below to avoid duplicates.
  useEffect(() => {
    if (notifications.length === 0) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }
    const fresh = notifications.filter(
      (n) => !seenIds.current!.has(n.id) && !n.isRead && n.type !== 'booking'
    );
    fresh.forEach((n) => {
      const icon = n.type === 'system' ? 'ℹ️' : '📢';
      const preview = n.message.length > 70 ? n.message.slice(0, 70) + '…' : n.message;
      toast(`${n.title} — ${preview}`, {
        icon,
        duration: 6000,
        style: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '13px' },
      });
      seenIds.current!.add(n.id);
    });
    notifications.forEach((n) => seenIds.current!.add(n.id));
  }, [notifications]);

  // Live booking alert — identical pattern to useNewBookingAlert used by the owner.
  // No limit/status filter in the query so every new booking always appears in docChanges().
  useEffect(() => {
    if (!user) return;
    let isFirstLoad = true;
    const unsub = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      if (isFirstLoad) {
        seenBookingIds.current = new Set(snapshot.docs.map((d) => d.id));
        isFirstLoad = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        if (seenBookingIds.current!.has(change.doc.id)) return;
        seenBookingIds.current!.add(change.doc.id);
        const data = change.doc.data();
        if (data.status !== 'Confirmed' || data.isOwnerBlock) return;
        const booking = { id: change.doc.id, ...data } as Record<string, unknown> & { id: string };
        toast.custom(
          (t) => (
            <div
              className={`flex items-start gap-3 p-4 bg-surface border border-primary/40 rounded-2xl shadow-2xl w-80 transition-all duration-300 ${
                t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary-dim flex items-center justify-center flex-shrink-0">
                <CalendarCheck size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">New Booking!</p>
                <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">
                  {booking.spaceName as string}
                </p>
                <p className="text-text-muted text-xs">
                  {formatDate(booking.date as string)} · {booking.startTime as string}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-success text-xs font-semibold">
                    {formatCurrency(booking.total as number)}
                  </span>
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      window.location.href = `/admin/bookings?bookingId=${booking.id}`;
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    View →
                  </button>
                </div>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-text-muted hover:text-white transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ),
          { duration: 8000, position: 'top-right' }
        );
      });
    });
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Failed to log out.');
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-dim border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">SR</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SpaceRoom</p>
            <p className="text-text-muted text-xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-text-muted text-xs uppercase tracking-wider px-2 mb-2 font-medium">Main Menu</p>
        <ul className="space-y-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group',
                    active
                      ? 'bg-primary-dim text-primary border-l-2 border-primary pl-[10px]'
                      : 'text-text-secondary hover:bg-surface2 hover:text-white'
                  )}
                >
                  <Icon size={18} className={active ? 'text-primary' : 'text-text-muted group-hover:text-white'} />
                  <span className="flex-1">{label}</span>
                  {label === 'Notifications' && totalBadge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center font-medium">
                      {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                  )}
                  {active && <ChevronRight size={14} className="text-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-dim flex items-center justify-center">
            <span className="text-primary text-xs font-bold">
              {userProfile?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userProfile?.fullName || 'Admin'}</p>
            <p className="text-text-muted text-xs truncate">{userProfile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-danger/10 hover:text-danger transition-all"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
