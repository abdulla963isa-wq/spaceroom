'use client';

import { useState, useEffect, useRef } from 'react';
import { Space, Venue } from '@/types';
import { createDoc, updateDoc, submitPendingChange } from '@/lib/firestore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Upload, X, ImageIcon } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';
import { resolveImage } from '@/lib/images';

const SPACE_TYPES = ['Office', 'Meeting Room', 'Event Hall', 'Studio', 'Coworking', 'Private Room', 'Conference', 'Meetings', 'Events', 'Work'];

interface SpaceFormProps {
  space?: Space;
  preselectedVenueId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SpaceForm({ space, preselectedVenueId, onSuccess, onCancel }: SpaceFormProps) {
  const { user, userProfile, role } = useAuth();
  const isEditing = !!space;
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    venueId: space?.venueId || preselectedVenueId || '',
    title: space?.title || '',
    description: space?.description || '',
    image: space?.image || '',
    tags: space?.tags?.join(', ') || '',
    type: space?.type || SPACE_TYPES[0],
    capacity: space?.capacity?.toString() || '',
    pricePerHour: space?.pricePerHour?.toString() || '',
    quantity: space?.quantity?.toString() || '1',
    availabilityText: space?.availabilityText || '',
    isActive: space?.isActive ?? true,
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const q = role === 'admin'
          ? collection(db, 'venues')
          : query(collection(db, 'venues'), where('ownerId', '==', user?.uid || ''));
        const snapshot = await getDocs(q);
        setVenues(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Venue)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
  }, [user, role]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, image: data.secure_url }));
      toast.success('Image uploaded.');
    } catch (err: unknown) {
      console.error('Upload error:', err);
      toast.error(`Upload failed: ${err instanceof Error ? err.message : String(err)}`, { duration: 8000 });
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setForm((prev) => ({ ...prev, image: '' }));
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.venueId || !form.title || !form.pricePerHour || !form.capacity) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (uploading) {
      toast.error('Please wait for the image to finish uploading.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        venueId: form.venueId,
        title: form.title,
        description: form.description,
        image: form.image,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        type: form.type,
        capacity: parseInt(form.capacity) || 0,
        pricePerHour: parseFloat(form.pricePerHour) || 0,
        quantity: parseInt(form.quantity) || 1,
        availabilityText: form.availabilityText,
        isActive: form.isActive,
      };

      if (role === 'owner') {
        const ownerName = userProfile?.fullName || user?.email || 'Owner';
        if (isEditing && space?.id) {
          const changes: Record<string, { from: unknown; to: unknown }> = {};
          if (data.title !== space.title) changes.title = { from: space.title, to: data.title };
          if (data.venueId !== space.venueId) changes.venueId = { from: space.venueId, to: data.venueId };
          if (data.type !== space.type) changes.type = { from: space.type, to: data.type };
          if (data.capacity !== space.capacity) changes.capacity = { from: space.capacity, to: data.capacity };
          if (data.pricePerHour !== space.pricePerHour) changes.pricePerHour = { from: space.pricePerHour, to: data.pricePerHour };
          if (data.quantity !== (space.quantity ?? 1)) changes.quantity = { from: space.quantity ?? 1, to: data.quantity };
          if (data.description !== (space.description || '')) changes.description = { from: space.description || '', to: data.description };
          if (data.availabilityText !== (space.availabilityText || '')) changes.availabilityText = { from: space.availabilityText || '', to: data.availabilityText };
          if (data.isActive !== space.isActive) changes.isActive = { from: space.isActive, to: data.isActive };
          if (data.image !== (space.image || '')) changes.image = { from: space.image || '', to: data.image };
          const origTags = JSON.stringify([...(space.tags || [])].sort());
          const newTags = JSON.stringify([...data.tags].sort());
          if (origTags !== newTags) changes.tags = { from: space.tags || [], to: data.tags };

          if (Object.keys(changes).length === 0) {
            toast.error('No changes to submit.');
            setLoading(false);
            return;
          }
          const selectedVenue = venues.find((v) => v.id === (space.venueId || data.venueId));
          await submitPendingChange('space', 'edit', space.id, space.title, user!.uid, ownerName, changes as Record<string, unknown>, selectedVenue?.name);
          toast.success('Changes submitted for admin approval.');
        } else {
          const selectedVenue = venues.find((v) => v.id === data.venueId);
          await submitPendingChange('space', 'create', undefined, data.title, user!.uid, ownerName, data as Record<string, unknown>, selectedVenue?.name);
          toast.success('Space submitted for admin approval.');
        }
        onSuccess();
        return;
      }

      if (isEditing && space?.id) {
        await updateDoc('spaces', space.id, data);
        toast.success('Space updated successfully.');
      } else {
        await createDoc('spaces', data);
        toast.success('Space created successfully.');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save space. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayImage = imagePreview || resolveImage(form.image);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Venue Select */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Venue *</label>
        <select
          value={form.venueId}
          onChange={(e) => setForm({ ...form, venueId: e.target.value })}
          disabled={loadingVenues}
          className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        >
          <option value="">Select a venue</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Space Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Executive Meeting Room"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            {SPACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Capacity *</label>
          <input
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="10"
            min="1"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Price per Hour (BHD) *</label>
          <input
            type="number"
            step="0.01"
            value={form.pricePerHour}
            onChange={(e) => setForm({ ...form, pricePerHour: e.target.value })}
            placeholder="15.00"
            min="0"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Quantity</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="1"
            min="1"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the space..."
            rows={3}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Space Photo</label>

          {displayImage ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayImage} alt="Preview" className="w-full h-40 object-cover" />
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm">Uploading…</span>
                </div>
              )}
              {!uploading && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-all"
            >
              <Upload size={22} />
              <span className="text-sm">Click to upload a photo</span>
              <span className="text-xs opacity-60">PNG, JPG up to 5MB</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* URL fallback */}
          <div className="mt-2 flex items-center gap-2">
            <ImageIcon size={13} className="text-text-muted flex-shrink-0" />
            <input
              type="url"
              value={form.image?.startsWith('http') ? form.image : ''}
              onChange={(e) => {
                setForm({ ...form, image: e.target.value });
                setImagePreview('');
              }}
              placeholder="Or paste an image URL..."
              className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-white placeholder-text-muted text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Tags (comma separated)</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="wifi, projector, whiteboard"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Availability Text</label>
          <input
            type="text"
            value={form.availabilityText}
            onChange={(e) => setForm({ ...form, availabilityText: e.target.value })}
            placeholder="e.g. 9:00 AM - 9:00 PM, Mon-Sat"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border">
        <span className="text-sm text-text-secondary">Active Listing</span>
        <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:bg-surface2 hover:text-white transition-all text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 py-2.5 rounded-xl bg-primary text-bg font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {loading ? 'Submitting...' : role === 'owner' ? 'Submit for Approval' : isEditing ? 'Update Space' : 'Create Space'}
        </button>
      </div>
    </form>
  );
}
