'use client';

import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          variant === 'danger' ? 'bg-danger/10' : 'bg-primary-dim'
        )}>
          <AlertTriangle
            size={28}
            className={variant === 'danger' ? 'text-danger' : 'text-primary'}
          />
        </div>

        <p className="text-text-secondary text-sm leading-relaxed">{message}</p>

        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-border text-text-secondary hover:bg-surface2 hover:text-white transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50',
              variant === 'danger'
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-primary text-bg hover:bg-primary/90'
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                Processing...
              </div>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
