'use client';

import { useState } from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  spaceName?: string;
  date?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (restoreSlot: boolean) => void;
}

export default function CancelBookingModal({
  isOpen, spaceName, date, loading = false, onClose, onConfirm,
}: Props) {
  const [restoreSlot, setRestoreSlot] = useState(true);

  const handleConfirm = () => onConfirm(restoreSlot);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Booking" size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-danger" />
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">
          Cancel the booking for{' '}
          <span className="text-white font-semibold">{spaceName}</span>
          {date && (
            <>
              {' '}on{' '}
              <span className="text-white font-semibold">{date}</span>
            </>
          )}? The customer will be notified.
        </p>

        {/* Restore slot toggle */}
        <label className="flex items-start gap-3 w-full text-left cursor-pointer bg-surface2 border border-border rounded-xl px-4 py-3 hover:border-primary/40 transition-colors">
          <input
            type="checkbox"
            checked={restoreSlot}
            onChange={(e) => setRestoreSlot(e.target.checked)}
            className="mt-0.5 accent-primary w-4 h-4 flex-shrink-0"
          />
          <div>
            <p className="text-white text-sm font-medium">Restore this time slot</p>
            <p className="text-text-muted text-xs mt-0.5">
              {restoreSlot
                ? 'The slot will be freed — other customers can book it.'
                : 'The slot stays blocked — no one else can book this time.'}
            </p>
          </div>
        </label>

        <div className="flex gap-3 w-full mt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface2 hover:text-white transition-all text-sm font-medium"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-danger text-white font-semibold text-sm hover:bg-danger/90 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling...
              </span>
            ) : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
