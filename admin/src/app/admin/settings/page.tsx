'use client';

import { useState } from 'react';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { updateDoc } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import PasswordInput from '@/components/ui/PasswordInput';
import { User as UserIcon, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user, userProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    fullName: userProfile?.fullName || '',
    email: userProfile?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!user || !userProfile) return;
    setProfileLoading(true);
    try {
      await updateDoc('users', user.uid, {
        fullName: profileForm.fullName,
        email: profileForm.email,
      });
      if (profileForm.email !== user.email) {
        await updateEmail(user, profileForm.email);
      }
      toast.success('Profile updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('requires-recent-login')) {
        toast.error('Please sign out and sign in again before changing your email.');
      } else {
        toast.error('Failed to update profile.');
      }
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
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
              />
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

      </div>
    </div>
  );
}
