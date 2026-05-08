'use client';

import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { updateDoc } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import PasswordInput from '@/components/ui/PasswordInput';
import Toggle from '@/components/ui/Toggle';
import { User as UserIcon, Lock, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OwnerSettingsPage() {
  const { user, userProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    fullName: userProfile?.fullName || '',
    phoneNumber: userProfile?.phoneNumber || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifPrefs, setNotifPrefs] = useState({
    newBookings: true,
    cancellations: true,
    announcements: true,
    dailySummary: false,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      await updateDoc('users', user.uid, {
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
      });
      toast.success('Profile updated successfully.');
    } catch {
      toast.error('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!user || !user.email) return;
    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordForm.newPassword);
      toast.success('Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        toast.error('Current password is incorrect.');
      } else {
        toast.error('Failed to change password. Please try again.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Header title="Settings" />
      <div className="p-6 max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary-dim flex items-center justify-center">
              <UserIcon size={18} className="text-primary" />
            </div>
            <h2 className="text-white font-semibold">Profile</h2>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-surface2 rounded-xl border border-border">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <span className="text-warning text-2xl font-bold">
                {userProfile?.fullName?.charAt(0)?.toUpperCase() || 'O'}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold">{userProfile?.fullName || 'Owner'}</p>
              <p className="text-text-muted text-sm">{userProfile?.email}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20 mt-1">
                Space Owner
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                placeholder="+973 XXXX XXXX"
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={userProfile?.email || ''}
                readOnly
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-text-muted cursor-not-allowed"
              />
              <p className="text-text-muted text-xs mt-1">Email cannot be changed from here. Contact admin.</p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={profileLoading}
              className="px-6 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
              <Lock size={18} className="text-warning" />
            </div>
            <h2 className="text-white font-semibold">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Current Password</label>
              <PasswordInput
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">New Password</label>
              <PasswordInput
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm New Password</label>
              <PasswordInput
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                autoComplete="new-password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading}
              className="px-6 py-2.5 bg-warning text-bg font-semibold text-sm rounded-xl hover:bg-warning/90 disabled:opacity-50 transition-all"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center">
              <Bell size={18} className="text-success" />
            </div>
            <h2 className="text-white font-semibold">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'newBookings', label: 'New Bookings', desc: 'Get notified when a new booking is made' },
              { key: 'cancellations', label: 'Cancellations', desc: 'Get notified when a booking is cancelled' },
              { key: 'announcements', label: 'Announcements', desc: 'Receive platform announcements' },
              { key: 'dailySummary', label: 'Daily Summary', desc: 'Receive a daily summary of your bookings' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border">
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                </div>
                <Toggle
                  checked={notifPrefs[key as keyof typeof notifPrefs]}
                  onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key as keyof typeof notifPrefs] })}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.success('Notification preferences saved (UI only).')}
            className="mt-4 px-6 py-2.5 bg-success text-bg font-semibold text-sm rounded-xl hover:bg-success/90 transition-all"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
