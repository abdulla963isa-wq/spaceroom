'use client';

import { useState, useRef } from 'react';
import { Venue } from '@/types';
import { createDoc, updateDoc } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import { resolveImage } from '@/lib/images';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Upload, X, ImageIcon } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

const CATEGORIES = ['Work', 'Meetings', 'Events', 'Studio', 'Training', 'Coworking'];

interface VenueFormProps {
  venue?: Venue;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VenueForm({ venue, onSuccess, onCancel }: VenueFormProps) {
  const { user } = useAuth();
  const isEditing = !!venue;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: venue?.name || '',
    location: venue?.location || '',
    description: venue?.description || '',
    heroImage: venue?.heroImage || '',
    categories: venue?.categories || [],
    latitude: venue?.latitude?.toString() || '',
    longitude: venue?.longitude?.toString() || '',
    isActive: venue?.isActive ?? true,
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleCategory = (cat: string) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

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
      setForm((prev) => ({ ...prev, heroImage: data.secure_url }));
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
    setForm((prev) => ({ ...prev, heroImage: '' }));
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location) {
      toast.error('Name and location are required.');
      return;
    }
    if (uploading) {
      toast.error('Please wait for the image to finish uploading.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        name: form.name,
        location: form.location,
        description: form.description,
        heroImage: form.heroImage,
        categories: form.categories,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        isActive: form.isActive,
        ownerId: venue?.ownerId || user?.uid || '',
      };

      if (isEditing && venue?.id) {
        await updateDoc('venues', venue.id, data);
        toast.success('Venue updated successfully.');
      } else {
        await createDoc('venues', data);
        toast.success('Venue created successfully.');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save venue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayImage = imagePreview || resolveImage(form.heroImage);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Venue Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. The Hub Bahrain"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Location *</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Manama, Bahrain"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the venue..."
            rows={3}
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Hero Photo Upload */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Hero Photo</label>

          {displayImage ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayImage} alt="Preview" className="w-full h-44 object-cover" />
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
              className="w-full h-36 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-all"
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

          <div className="mt-2 flex items-center gap-2">
            <ImageIcon size={13} className="text-text-muted flex-shrink-0" />
            <input
              type="url"
              value={form.heroImage?.startsWith('http') ? form.heroImage : ''}
              onChange={(e) => {
                setForm({ ...form, heroImage: e.target.value });
                setImagePreview('');
              }}
              placeholder="Or paste an image URL..."
              className="flex-1 bg-surface2 border border-border rounded-lg px-3 py-1.5 text-white placeholder-text-muted text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Latitude</label>
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            placeholder="26.2235"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Longitude</label>
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            placeholder="50.5860"
            className="w-full bg-surface2 border border-border rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                form.categories.includes(cat)
                  ? 'bg-primary-dim text-primary border-primary/20'
                  : 'bg-surface2 text-text-muted border-border hover:border-primary/40'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Status toggle */}
      <div className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border">
        <span className="text-sm text-text-secondary">Active Listing</span>
        <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
      </div>

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
          {loading ? 'Saving...' : isEditing ? 'Update Venue' : 'Create Venue'}
        </button>
      </div>
    </form>
  );
}
