'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Space, Venue, PendingChange } from '@/types';
import { updateDoc, deleteDoc, submitPendingChange } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import SpaceForm from '@/components/forms/SpaceForm';
import { Search, Plus, Edit, Trash2, Grid3X3, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import SpaceCalendarModal from '@/components/ui/SpaceCalendarModal';

const PAGE_SIZE = 10;

export default function OwnerSpacesPage() {
  const { user, userProfile } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editSpace, setEditSpace] = useState<Space | null>(null);
  const [deleteSpace, setDeleteSpace] = useState<Space | null>(null);
  const [calendarSpace, setCalendarSpace] = useState<Space | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingSpaceIds, setPendingSpaceIds] = useState<Set<string>>(new Set());
  const [pendingNewCount, setPendingNewCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const venuesQuery = query(collection(db, 'venues'), where('ownerId', '==', user.uid));
    const unsubVenues = onSnapshot(venuesQuery, (snapshot) => {
      const venueList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue));
      setVenues(venueList);

      if (venueList.length === 0) {
        setSpaces([]);
        setLoading(false);
        return;
      }

      const venueIds = venueList.map((v) => v.id);
      const spacesQuery = query(collection(db, 'spaces'), where('venueId', 'in', venueIds.slice(0, 10)));
      const unsubSpaces = onSnapshot(spacesQuery, (sSnapshot) => {
        setSpaces(sSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Space)));
        setLoading(false);
      });

      return () => unsubSpaces();
    });

    return () => unsubVenues();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'pendingChanges'),
      where('ownerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PendingChange))
        .filter((c) => c.status === 'pending' && c.type === 'space');
      setPendingSpaceIds(new Set(changes.filter((c) => c.action === 'edit' && c.entityId).map((c) => c.entityId!)));
      setPendingNewCount(changes.filter((c) => c.action === 'create').length);
    });
    return () => unsub();
  }, [user]);

  const venueMap = useMemo(() => {
    const m: Record<string, string> = {};
    venues.forEach((v) => { m[v.id] = v.name; });
    return m;
  }, [venues]);

  const filtered = useMemo(() => {
    return spaces.filter((s) => {
      const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase());
      const matchVenue = !venueFilter || s.venueId === venueFilter;
      return matchSearch && matchVenue;
    });
  }, [spaces, search, venueFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleActive = async (space: Space) => {
    try {
      const ownerName = userProfile?.fullName || user?.email || 'Owner';
      const changes = { isActive: { from: space.isActive, to: !space.isActive } };
      await submitPendingChange(
        'space', 'edit', space.id, space.title,
        user!.uid, ownerName,
        changes as Record<string, unknown>,
        venueMap[space.venueId]
      );
      toast.success(`Space ${space.isActive ? 'deactivation' : 'activation'} submitted for admin approval.`);
    } catch {
      toast.error('Failed to update space.');
    }
  };

  const handleDelete = async () => {
    if (!deleteSpace) return;
    setActionLoading(true);
    try {
      await deleteDoc('spaces', deleteSpace.id);
      toast.success('Space deleted.');
      setDeleteSpace(null);
    } catch {
      toast.error('Failed to delete space.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'title', label: 'Title',
      render: (v, row) => (
        <div>
          <p className="text-white font-medium">{v as string}</p>
          <p className="text-text-muted text-xs">{(row as unknown as Space).type}</p>
        </div>
      ),
    },
    { key: 'venueId', label: 'Venue', render: (v) => venueMap[v as string] || '—' },
    { key: 'pricePerHour', label: 'Price/hr', render: (v) => <span className="text-primary font-medium">{formatCurrency(v as number)}</span> },
    { key: 'capacity', label: 'Capacity' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'isActive', label: 'Status',
      render: (v, row) => (
        <div className="flex flex-col gap-1">
          <Badge status={v ? 'active' : 'inactive'} />
          {pendingSpaceIds.has((row as unknown as Space).id) && (
            <span className="text-warning text-xs font-medium whitespace-nowrap">Pending Approval</span>
          )}
        </div>
      ),
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalendarSpace(row as unknown as Space)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all"
            title="View availability calendar"
          >
            <CalendarDays size={14} />
          </button>
          <button onClick={() => setEditSpace(row as unknown as Space)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all">
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleToggleActive(row as unknown as Space)}
            className="px-2 py-1 rounded-lg text-xs font-medium text-warning bg-warning/10 hover:bg-warning/20 transition-all"
          >
            {(row as unknown as Space).isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => setDeleteSpace(row as unknown as Space)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="My Spaces" />
      <div className="p-6 space-y-4">
        {pendingNewCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 bg-warning/5 border border-warning/20 rounded-xl text-warning text-sm">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse flex-shrink-0" />
            {pendingNewCount} new space{pendingNewCount > 1 ? 's' : ''} pending admin approval
          </div>
        )}
        <div className="flex gap-3 items-center justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search spaces..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-surface2 border border-border rounded-xl text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={venueFilter}
              onChange={(e) => { setVenueFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All Venues</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
          >
            <Plus size={16} />
            Add Space
          </button>
        </div>
        <div className="text-text-muted text-sm">{filtered.length} spaces</div>
        <DataTable
          columns={columns}
          data={paginated as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No spaces found. Create your first space!"
          emptyIcon={<Grid3X3 size={32} />}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Space" size="lg">
        <SpaceForm onSuccess={() => setShowAddModal(false)} onCancel={() => setShowAddModal(false)} />
      </Modal>
      <Modal isOpen={!!editSpace} onClose={() => setEditSpace(null)} title="Edit Space" size="lg">
        {editSpace && <SpaceForm space={editSpace} onSuccess={() => setEditSpace(null)} onCancel={() => setEditSpace(null)} />}
      </Modal>
      <ConfirmModal
        isOpen={!!deleteSpace}
        onClose={() => setDeleteSpace(null)}
        onConfirm={handleDelete}
        title="Delete Space"
        message={`Delete "${deleteSpace?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
      <SpaceCalendarModal
        isOpen={!!calendarSpace}
        space={calendarSpace}
        onClose={() => setCalendarSpace(null)}
      />
    </div>
  );
}
