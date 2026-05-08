'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { Space, Venue } from '@/types';
import { updateDoc, deleteDoc } from '@/lib/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import SpaceForm from '@/components/forms/SpaceForm';
import { Search, Plus, Edit, Trash2, Grid3X3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function AdminSpacesPage() {
  const { data: spaces, loading } = useCollection<Space>('spaces');
  const [venues, setVenues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editSpace, setEditSpace] = useState<Space | null>(null);
  const [deleteSpace, setDeleteSpace] = useState<Space | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [allVenues, setAllVenues] = useState<Venue[]>([]);

  useEffect(() => {
    const fetchVenues = async () => {
      const snapshot = await getDocs(collection(db, 'venues'));
      const map: Record<string, string> = {};
      const arr: Venue[] = [];
      snapshot.docs.forEach((d) => {
        const v = { id: d.id, ...d.data() } as Venue;
        map[d.id] = v.name;
        arr.push(v);
      });
      setVenues(map);
      setAllVenues(arr);
    };
    fetchVenues();
  }, []);

  const filtered = useMemo(() => {
    return spaces.filter((s) => {
      const matchSearch = !search || s.title?.toLowerCase().includes(search.toLowerCase());
      const matchVenue = !venueFilter || s.venueId === venueFilter;
      const matchStatus = statusFilter === '' ? true : s.isActive === (statusFilter === 'active');
      return matchSearch && matchVenue && matchStatus;
    });
  }, [spaces, search, venueFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleActive = async (space: Space) => {
    try {
      await updateDoc('spaces', space.id, { isActive: !space.isActive });
      toast.success(`Space ${space.isActive ? 'deactivated' : 'activated'}.`);
    } catch {
      toast.error('Failed to update space status.');
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
    {
      key: 'venueId', label: 'Venue',
      render: (v) => venues[v as string] || '—',
    },
    { key: 'type', label: 'Type' },
    {
      key: 'pricePerHour', label: 'Price/hr',
      render: (v) => <span className="text-primary font-medium">{formatCurrency(v as number)}</span>,
    },
    { key: 'capacity', label: 'Capacity' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <Badge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditSpace(row as unknown as Space)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleToggleActive(row as unknown as Space)}
            className="px-2 py-1 rounded-lg text-xs font-medium text-warning bg-warning/10 hover:bg-warning/20 transition-all"
          >
            {(row as unknown as Space).isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setDeleteSpace(row as unknown as Space)}
            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <Header title="Spaces" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
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
              {allVenues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="bg-surface2 border border-border rounded-xl px-3 py-2.5 text-text-secondary text-sm focus:outline-none focus:border-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all whitespace-nowrap"
          >
            <Plus size={16} />
            Add Space
          </button>
        </div>

        <div className="text-text-muted text-sm">{filtered.length} spaces found</div>

        <DataTable
          columns={columns}
          data={paginated as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No spaces found."
          emptyIcon={<Grid3X3 size={32} />}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Space" size="lg">
        <SpaceForm
          onSuccess={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal isOpen={!!editSpace} onClose={() => setEditSpace(null)} title="Edit Space" size="lg">
        {editSpace && (
          <SpaceForm
            space={editSpace}
            onSuccess={() => setEditSpace(null)}
            onCancel={() => setEditSpace(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteSpace}
        onClose={() => setDeleteSpace(null)}
        onConfirm={handleDelete}
        title="Delete Space"
        message={`Are you sure you want to delete "${deleteSpace?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
