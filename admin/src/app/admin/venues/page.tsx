'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { Venue, User } from '@/types';
import { updateDoc, deleteDoc } from '@/lib/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Header from '@/components/layout/Header';
import DataTable, { Column } from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Pagination from '@/components/ui/Pagination';
import VenueForm from '@/components/forms/VenueForm';
import { Search, Plus, Edit, Trash2, Building2, Grid3X3 } from 'lucide-react';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function AdminVenuesPage() {
  const { data: venues, loading } = useCollection<Venue>('venues');
  const [owners, setOwners] = useState<Record<string, string>>({});
  const [spaceCounts, setSpaceCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [deleteVenue, setDeleteVenue] = useState<Venue | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchOwners = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const map: Record<string, string> = {};
      snapshot.docs.forEach((d) => {
        const u = d.data() as User;
        map[d.id] = u.fullName || u.email;
      });
      setOwners(map);
    };
    const fetchSpaces = async () => {
      const snapshot = await getDocs(collection(db, 'spaces'));
      const counts: Record<string, number> = {};
      snapshot.docs.forEach((d) => {
        const venueId = d.data().venueId;
        counts[venueId] = (counts[venueId] || 0) + 1;
      });
      setSpaceCounts(counts);
    };
    fetchOwners();
    fetchSpaces();
  }, []);

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      const matchSearch = !search ||
        v.name?.toLowerCase().includes(search.toLowerCase()) ||
        v.location?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === '' ? true : v.isActive === (statusFilter === 'active');
      return matchSearch && matchStatus;
    });
  }, [venues, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleToggleActive = async (venue: Venue) => {
    try {
      await updateDoc('venues', venue.id, { isActive: !venue.isActive });
      toast.success(`Venue ${venue.isActive ? 'deactivated' : 'activated'}.`);
    } catch {
      toast.error('Failed to update venue status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteVenue) return;
    setActionLoading(true);
    try {
      await deleteDoc('venues', deleteVenue.id);
      toast.success('Venue deleted.');
      setDeleteVenue(null);
    } catch {
      toast.error('Failed to delete venue.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'name', label: 'Venue Name',
      render: (v, row) => (
        <div>
          <p className="text-white font-medium">{v as string}</p>
          <p className="text-text-muted text-xs">{(row as unknown as Venue).location}</p>
        </div>
      ),
    },
    {
      key: 'ownerId', label: 'Owner',
      render: (v) => owners[v as string] || (v as string)?.slice(0, 8) || '—',
    },
    {
      key: 'categories', label: 'Categories',
      render: (v) => (
        <div className="flex flex-wrap gap-1">
          {((v as string[]) || []).slice(0, 3).map((cat) => (
            <span key={cat} className="px-1.5 py-0.5 bg-surface2 border border-border rounded text-xs text-text-muted">{cat}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'id', label: 'Spaces',
      render: (v) => (
        <span className="flex items-center gap-1 text-text-secondary">
          <Grid3X3 size={12} />
          {spaceCounts[v as string] || 0}
        </span>
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: (v) => <Badge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'id', label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditVenue(row as unknown as Venue)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-dim transition-all"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleToggleActive(row as unknown as Venue)}
            className="px-2 py-1 rounded-lg text-xs font-medium text-warning bg-warning/10 hover:bg-warning/20 transition-all"
          >
            {(row as unknown as Venue).isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setDeleteVenue(row as unknown as Venue)}
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
      <Header title="Venues" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search venues..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-surface2 border border-border rounded-xl text-white placeholder-text-muted text-sm focus:outline-none focus:border-primary"
              />
            </div>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
          >
            <Plus size={16} />
            Add Venue
          </button>
        </div>

        <div className="text-text-muted text-sm">{filtered.length} venues found</div>

        <DataTable
          columns={columns}
          data={paginated as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No venues found."
          emptyIcon={<Building2 size={32} />}
        />
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Venue" size="lg">
        <VenueForm
          onSuccess={() => { setShowAddModal(false); toast.success('Venue created.'); }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editVenue} onClose={() => setEditVenue(null)} title="Edit Venue" size="lg">
        {editVenue && (
          <VenueForm
            venue={editVenue}
            onSuccess={() => { setEditVenue(null); }}
            onCancel={() => setEditVenue(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteVenue}
        onClose={() => setDeleteVenue(null)}
        onConfirm={handleDelete}
        title="Delete Venue"
        message={`Are you sure you want to delete "${deleteVenue?.name}"? All associated spaces may still exist.`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
