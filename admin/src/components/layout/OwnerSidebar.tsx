'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Grid3X3,
  CalendarCheck,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
  { label: 'My Venues', href: '/owner/venues', icon: Building2 },
  { label: 'My Spaces', href: '/owner/spaces', icon: Grid3X3 },
  { label: 'Bookings', href: '/owner/bookings', icon: CalendarCheck },
  { label: 'Analytics', href: '/owner/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/owner/notifications', icon: Bell },
  { label: 'Settings', href: '/owner/settings', icon: Settings },
];

export default function OwnerSidebar() {
  const pathname = usePathname();
  const { userProfile, logout } = useAuth();
  const { unreadCount, notifications } = useNotifications();
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (notifications.length === 0) return;
    if (seenIds.current === null) {
      seenIds.current = new Set(notifications.map((n) => n.id));
      return;
    }
    const fresh = notifications.filter((n) => !seenIds.current!.has(n.id) && !n.isRead && n.type !== 'booking');
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

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Failed to log out.');
    }
  };

  const isActive = (href: string) => {
    if (href === '/owner') return pathname === '/owner';
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
            <p className="text-text-muted text-xs mt-0.5">Owner Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-text-muted text-xs uppercase tracking-wider px-2 mb-2 font-medium">My Portal</p>
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
                  {label === 'Notifications' && unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
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
          <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
            <span className="text-warning text-xs font-bold">
              {userProfile?.fullName?.charAt(0)?.toUpperCase() || 'O'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{userProfile?.fullName || 'Owner'}</p>
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
