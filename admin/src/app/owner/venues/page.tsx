'use client';

import { useState, useEffect } from 'react';
import { query, where, onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Venue, PendingChange } from '@/types';
import { updateDoc, deleteDoc } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import VenueForm from '@/components/forms/VenueForm';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Plus, MapPin, Building2, Edit, Trash2, Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveImage } from '@/lib/images';
import toast from 'react-hot-toast';

export default function OwnerVenuesPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const [deleteVenue, setDeleteVenue] = useState<Venue | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingVenueIds, setPendingVenueIds] = useState<Set<string>>(new Set());
  const [pendingNewCount, setPendingNewCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'venues'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVenues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'pendingChanges'),
      where('ownerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const changes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PendingChange))
        .filter((c) => c.status === 'pending' && c.type === 'venue');
      setPendingVenueIds(new Set(changes.filter((c) => c.action === 'edit' && c.entityId).map((c) => c.entityId!)));
      setPendingNewCount(changes.filter((c) => c.action === 'create').length);
    });
    return () => unsub();
  }, [user]);

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

  return (
    <div className="flex flex-col flex-1">
      <Header title="My Venues" />
      <div className="p-6">
        {pendingNewCount > 0 && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-warning/5 border border-warning/20 rounded-xl text-warning text-sm">
            <span className="w-2 h-2 rounded-full bg-warning animate-pulse flex-shrink-0" />
            {pendingNewCount} new venue{pendingNewCount > 1 ? 's' : ''} pending admin approval
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <p className="text-text-muted text-sm">{venues.length} venue{venues.length !== 1 ? 's' : ''}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
          >
            <Plus size={16} />
            Add Venue
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-muted">
            <Building2 size={48} className="opacity-30" />
            <div className="text-center">
              <p className="font-medium text-white">No venues yet</p>
              <p className="text-sm mt-1">Create your first venue to get started.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-primary text-bg font-semibold text-sm rounded-xl hover:bg-primary/90 transition-all"
            >
              Add Your First Venue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div key={venue.id} className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-border/80 transition-colors">
                {/* Image */}
                <div className="h-40 bg-surface2 relative overflow-hidden">
                  {resolveImage(venue.heroImage) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveImage(venue.heroImage)} alt={venue.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 size={40} className="text-border" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                    <Badge status={venue.isActive ? 'active' : 'inactive'} />
                    {pendingVenueIds.has(venue.id) && (
                      <span className="px-2 py-0.5 bg-warning/90 text-bg text-xs rounded-full font-medium">
                        Pending Approval
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold">{venue.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-text-muted text-sm">
                    <MapPin size={13} />
                    <span>{venue.location}</span>
                  </div>

                  {venue.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {venue.categories.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 bg-surface2 border border-border rounded-full text-xs text-text-muted">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setEditVenue(venue)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface2 border border-border text-text-secondary hover:text-white hover:border-primary/40 text-xs font-medium transition-all"
                    >
                      <Edit size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(venue)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        venue.isActive
                          ? 'bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20'
                          : 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                      )}
                    >
                      {venue.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteVenue(venue)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all ml-auto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Venue" size="lg">
        <VenueForm
          onSuccess={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal isOpen={!!editVenue} onClose={() => setEditVenue(null)} title="Edit Venue" size="lg">
        {editVenue && (
          <VenueForm
            venue={editVenue}
            onSuccess={() => setEditVenue(null)}
            onCancel={() => setEditVenue(null)}
          />
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteVenue}
        onClose={() => setDeleteVenue(null)}
        onConfirm={handleDelete}
        title="Delete Venue"
        message={`Are you sure you want to delete "${deleteVenue?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
