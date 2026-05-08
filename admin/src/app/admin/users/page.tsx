'use client';

import { useState, useMemo, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc as firestoreUpdate } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCollection } from '@/hooks/useFirestore';
import { User, Venue } from '@/types';
import { updateDoc, deleteDoc, setDocById } from '@/lib/firestore';
import Header from '@/components/layout/Header';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import PasswordInput from '@/components/ui/PasswordInput';
import { Search, Plus, Edit, Trash2, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { serverTimestamp } from 'firebase/firestore';

const PAGE_SIZE = 10;

async function createAuthUser(email: string, password: string): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const code = data.error?.message || '';
    if (code.includes('EMAIL_EXISTS')) throw new Error('This email already has an account.');
    if (code.includes('WEAK_PASSWORD')) throw new Error('Password must be at least 6 characters.');
    if (code.includes('INVALID_EMAIL')) throw new Error('Invalid email address.');
    throw new Error('Failed to create account.');
  }
  return data.localId as string;
}

export default function AdminUsersPage() {
  const { data: users, loading } = useCollection<User>('users');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: '', email: '', phoneNumber: '',
    role: 'customer' as User['role'], isActive: true, venueId: '',
  });
  const [addForm, setAddForm] = useState({
    fullName: '', email: '', password: '', phoneNumber: '',
    role: 'customer' as User['role'], venueId: '',
  });

  useEffect(() => {
    getDocs(collection(db, 'venues')).then((snap) => {
      setVenues(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
    });
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search ||
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleEdit = (user: User) => {
    // Find which venue this owner currently owns
    const ownedVenue = venues.find((v) => v.ownerId === user.id);
    setEditUser(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive,
      venueId: ownedVenue?.id || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      const { venueId, ...userFields } = editForm;
      await updateDoc('users', editUser.id, userFields as unknown as Record<string, unknown>);

      // If setting as owner and a venue is selected, update that venue's ownerId
      if (editForm.role === 'owner' && venueId) {
        await firestoreUpdate(doc(db, 'venues', venueId), { ownerId: editUser.id });
        // Clear ownerId from any other venue previously owned by this user
        const prevVenues = venues.filter((v) => v.ownerId === editUser.id && v.id !== venueId);
        await Promise.all(prevVenues.map((v) =>
          firestoreUpdate(doc(db, 'venues', v.id), { ownerId: '' })
        ));
      }

      toast.success('User updated successfully.');
      setEditUser(null);
    } catch {
      toast.error('Failed to update user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await updateDoc('users', user.id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'suspended' : 'activated'}.`);
    } catch {
      toast.error('Failed to update user status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setActionLoading(true);
    try {
      await deleteDoc('users', deleteUser.id);
      toast.success('User deleted.');
      setDeleteUser(null);
    } catch {
      toast.error('Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!addForm.fullName || !addForm.email || !addForm.password) {
      toast.error('Name, email, and password are required.');
      return;
    }
    if (addForm.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (addForm.role === 'owner' && !addForm.venueId) {
      toast.error('Please select a venue for this owner.');
      return;
    }
    setActionLoading(true);
    try {
      // Step 1: Create Firebase Auth account
      let uid: string;
      try {
        uid = await createAuthUser(addForm.email, addForm.password);
      } catch (authErr: unknown) {
        throw authErr; // re-throw auth errors as-is (already have clear messages)
      }

      // Step 2: Save user profile to Firestore
      const { password, venueId, ...userFields } = addForm;
      void password;
      try {
        await setDocById('users', uid, {
          ...userFields,
          isActive: true,
          createdAt: serverTimestamp(),
        });
      } catch (fsErr: unknown) {
        const msg = fsErr instanceof Error ? fsErr.message : '';
        if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('insufficient')) {
          throw new Error(
            'Login account created, but Firestore blocked saving the profile.\n\nFix: Go to Firebase Console → Firestore → Rules and add this to your users match block:\n  allow write: if request.auth != null && (request.auth.uid == userId || get(...users/$(request.auth.uid)).data.role == "admin");'
          );
        }
        throw new Error('Login account created but profile save failed: ' + msg);
      }

      // Step 3: Assign venue if owner
      if (addForm.role === 'owner' && venueId) {
        await firestoreUpdate(doc(db, 'venues', venueId), { ownerId: uid });
      }

      toast.success('User created successfully. They can now log in.');
      setShowAddModal(false);
      setAddForm({ fullName: '', email: '', password: '', phoneNumber: '', role: 'customer', venueId: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user.';
      // Show multi-line errors in a more readable way via console + short toast
      if (msg.includes('\n')) {
        console.error('[Add User Error]', msg);
        toast.error(msg.split('\n')[0] + ' — see console for fix details.', { duration: 6000 });
      } else {
        toast.error(msg, { duration: 5000 });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'fullName', label: 'Name', render: (v) => <span className="text-white font-medium">{v as string || '—'}</span> },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone', render: (v) => (v as string) || '—' },
    { key: 'role', label: 'Role', render: (v) => <Badge status={v as string} /> },
    { key: 'isActive', label: 'Status', render: (v) => <Badge status={v ? 'active' : 'inactive'} /> },
    { key: 'createdAt', label: 'Created', render: (v) => formatDate(v as string) },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row as unknown as User)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleToggleActive(row as unknown as User)}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              (row as unknown as User).isActive
                ? 'text-warning bg-warning/10 hover:bg-warning/20'
                : 'text-success bg-success/10 hover:bg-success/20'
            }`}
          >
            {(row as unknown as User).isActive ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={() => setDeleteUser(row as unknown as User)}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const inputCls = 'w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary';

  return (
    <div className="flex flex-col flex-1">
      <Header title="Users" />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-surface2 border border-border rounded-xl text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        <div className="text-text-muted text-sm">{filtered.length} users found</div>

        <DataTable
          columns={columns}
          data={paginated as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No users found."
          emptyIcon={<Users size={32} />}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
            <input type="text" value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone Number</label>
            <input type="tel" value={editForm.phoneNumber} onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Role</label>
            <select
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value as User['role'] })}
              className={inputCls}
            >
              <option value="customer">Customer</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {editForm.role === 'owner' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Assign Venue</label>
              <select
                value={editForm.venueId}
                onChange={(e) => setEditForm({ ...editForm, venueId: e.target.value })}
                className={inputCls}
              >
                <option value="">Select a venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface2 text-sm">Cancel</button>
            <button onClick={handleSaveEdit} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50">
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name *</label>
            <input type="text" value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="John Doe" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email *</label>
            <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="john@example.com" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password *</label>
            <PasswordInput value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder="Min. 6 characters" className={inputCls} autoComplete="new-password" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Phone Number</label>
            <input type="tel" value={addForm.phoneNumber} onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })} placeholder="+973 XXXX XXXX" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Role *</label>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value as User['role'], venueId: '' })}
              className={inputCls}
            >
              <option value="customer">Customer</option>
              <option value="owner">Space Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {addForm.role === 'owner' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Assign Venue *</label>
              <select
                value={addForm.venueId}
                onChange={(e) => setAddForm({ ...addForm, venueId: e.target.value })}
                className={inputCls}
              >
                <option value="">Select which venue they manage</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <p className="text-text-muted text-xs mt-1">This owner will only see bookings and spaces for this venue.</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setShowAddModal(false); setAddForm({ fullName: '', email: '', password: '', phoneNumber: '', role: 'customer', venueId: '' }); }}
              className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteUser?.fullName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
