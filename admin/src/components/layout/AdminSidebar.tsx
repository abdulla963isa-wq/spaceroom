'use client';

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
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
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
  const { userProfile, logout } = useAuth();
  const { unreadCount } = useNotifications();

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
