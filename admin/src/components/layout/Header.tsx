'use client';

import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import NotificationDropdown from './NotificationDropdown';
import toast from 'react-hot-toast';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Failed to log out.');
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-white font-bold text-lg">{title}</h1>

      <div className="flex items-center gap-3">
        <NotificationDropdown />

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary-dim flex items-center justify-center">
            <span className="text-primary text-xs font-bold">
              {userProfile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-white text-sm font-medium leading-none">{userProfile?.fullName || 'User'}</p>
            <p className="text-text-muted text-xs mt-0.5 capitalize">{userProfile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
