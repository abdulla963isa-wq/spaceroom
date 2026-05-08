'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex w-12 h-[26px] rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0',
        checked ? 'bg-success' : 'bg-border'
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0'
        )}
      />
    </button>
  );
}
