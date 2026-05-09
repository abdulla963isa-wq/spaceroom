'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { setOwnerBlockedSlots } from '@/lib/firestore';
import Modal from './Modal';
import { ChevronLeft, ChevronRight, Lock, Slash } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Matches the mobile app's ALL_TIME_SLOTS
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM',
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

interface RawBooking {
  id: string;
  spaceId: string;
  venueId: string;
  date: string;
  reservedSlots: string[];
  status: string;
  isOwnerBlock?: boolean;
  userId?: string;
}

interface SpaceShape {
  id: string;
  title: string;
  venueId: string;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  space: SpaceShape | null;
  onClose: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────

function instanceId(spaceId: string, qty: number, idx: number): string {
  return qty <= 1 ? spaceId : `${spaceId}-${idx + 1}`;
}

function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthRange(month: Date): { start: string; end: string } {
  const y = month.getFullYear();
  const m = month.getMonth();
  const last = new Date(y, m + 1, 0);
  return {
    start: `${y}-${String(m + 1).padStart(2, '0')}-01`,
    end: toYMD(last),
  };
}

type CalDay = { date: string; day: number } | null;

function buildCalendar(month: Date): CalDay[] {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  const startDow = (first.getDay() + 6) % 7; // Mon=0
  const days: CalDay[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({
      day: d,
      date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }
  return days;
}

// ─── component ────────────────────────────────────────────────────────────

export default function SpaceCalendarModal({ isOpen, space, onClose }: Props) {
  const [instanceIdx, setInstanceIdx] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookings, setBookings] = useState<RawBooking[]>([]);
  const [saving, setSaving] = useState(false);

  const qty = space?.quantity ?? 1;
  const instId = space ? instanceId(space.id, qty, instanceIdx) : '';

  // Reset when modal opens / space changes
  useEffect(() => {
    if (isOpen) {
      setInstanceIdx(0);
      setSelectedDate(null);
      setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    }
  }, [isOpen, space?.id]);

  // Real-time bookings for the visible month
  useEffect(() => {
    if (!isOpen || !space) return;
    const { start, end } = monthRange(currentMonth);

    const q = query(
      collection(db, 'bookings'),
      where('venueId', '==', space.venueId)
    );

    const unsub = onSnapshot(q, (snap) => {
      setBookings(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as RawBooking))
          .filter((b) =>
            (b.status === 'Confirmed' || b.status === 'Blocked') &&
            b.date >= start && b.date <= end
          )
      );
    }, (err) => {
      console.error('Calendar bookings error:', err);
    });

    return () => unsub();
  }, [isOpen, space, currentMonth]);

  // ── per-day dot data ────────────────────────────────────────────────────

  const getDayInfo = useCallback((date: string) => {
    const dayBookings = bookings.filter((b) => {
      if (b.date !== date) return false;
      if (qty <= 1) return b.spaceId === space?.id || b.spaceId?.startsWith(`${space?.id}-`);
      return b.spaceId?.startsWith(`${space?.id}-`) || b.spaceId === space?.id;
    });
    const confirmed = dayBookings.filter((b) => b.status === 'Confirmed' && !b.isOwnerBlock);
    const blocked = dayBookings.filter((b) => b.status === 'Blocked');
    return { hasConfirmed: confirmed.length > 0, hasBlocked: blocked.length > 0 };
  }, [bookings, space, qty]);

  // ── per-instance slot data for selected date ────────────────────────────

  const slotData = useCallback((): { booked: Set<string>; blocked: Set<string> } => {
    if (!selectedDate) return { booked: new Set(), blocked: new Set() };
    const booked = new Set<string>();
    const blocked = new Set<string>();
    bookings
      .filter((b) => b.date === selectedDate && b.spaceId === instId)
      .forEach((b) => {
        (b.reservedSlots ?? []).forEach((s) => {
          if (b.isOwnerBlock || b.status === 'Blocked') blocked.add(s);
          else booked.add(s);
        });
      });
    return { booked, blocked };
  }, [bookings, selectedDate, instId]);

  // ── toggle a slot ───────────────────────────────────────────────────────

  const handleToggleSlot = async (slot: string) => {
    if (!space || !selectedDate) return;
    const { booked, blocked } = slotData();
    if (booked.has(slot)) return; // can't toggle a confirmed user booking

    setSaving(true);
    try {
      const newBlocked = new Set(blocked);
      if (blocked.has(slot)) newBlocked.delete(slot);
      else newBlocked.add(slot);

      await setOwnerBlockedSlots(
        instId,
        space.venueId,
        space.title,
        selectedDate,
        [...newBlocked]
      );
    } catch {
      toast.error('Failed to update availability.');
    } finally {
      setSaving(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────

  if (!space) return null;

  const calDays = buildCalendar(currentMonth);
  const { booked, blocked } = slotData();
  const today = toYMD(new Date());

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${space.title} — Availability`}
      size="xl"
    >
      <div className="space-y-5">

        {/* ── Instance selector ───────────────────────────────────────── */}
        {qty > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => { setInstanceIdx((i) => Math.max(0, i - 1)); setSelectedDate(null); }}
              disabled={instanceIdx === 0}
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-white hover:border-primary/50 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white font-semibold min-w-[80px] text-center">
              Room {instanceIdx + 1}
              <span className="text-text-muted text-xs block">of {qty}</span>
            </span>
            <button
              onClick={() => { setInstanceIdx((i) => Math.min(qty - 1, i + 1)); setSelectedDate(null); }}
              disabled={instanceIdx === qty - 1}
              className="p-1.5 rounded-lg border border-border text-text-muted hover:text-white hover:border-primary/50 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Month navigator ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); setSelectedDate(null); }}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-white hover:border-primary/40 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-white font-bold text-base">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() => { setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); setSelectedDate(null); }}
            className="p-2 rounded-xl border border-border text-text-muted hover:text-white hover:border-primary/40 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Calendar grid ───────────────────────────────────────────── */}
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-text-muted py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((cell, i) => {
              if (!cell) return <div key={`empty-${i}`} />;
              const { hasConfirmed, hasBlocked } = getDayInfo(cell.date);
              const isSelected = selectedDate === cell.date;
              const isToday = cell.date === today;
              const isPast = cell.date < today;

              return (
                <button
                  key={cell.date}
                  onClick={() => setSelectedDate(isSelected ? null : cell.date)}
                  className={cn(
                    'flex flex-col items-center py-1.5 px-1 rounded-xl border transition-all text-sm',
                    isSelected
                      ? 'bg-primary/20 border-primary text-white'
                      : isPast
                      ? 'border-transparent text-text-muted opacity-50 cursor-default'
                      : 'border-transparent hover:border-border hover:bg-surface2 text-text-secondary',
                    isToday && !isSelected && 'border-primary/30 text-primary'
                  )}
                  disabled={isPast}
                >
                  <span className="font-medium leading-none">{cell.day}</span>
                  {/* Dots */}
                  <div className="flex gap-0.5 mt-1 h-1.5">
                    {hasConfirmed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    {hasBlocked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Legend ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" /> Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger inline-block" /> Blocked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success inline-block" /> Available
          </span>
        </div>

        {/* ── Slot panel ──────────────────────────────────────────────── */}
        {selectedDate && (
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-surface2 border-b border-border">
              <div>
                <p className="text-white font-semibold text-sm">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
                {qty > 1 && (
                  <p className="text-text-muted text-xs mt-0.5">Room {instanceIdx + 1}</p>
                )}
              </div>
              <p className="text-text-muted text-xs">Click a slot to block or unblock it</p>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isBooked = booked.has(slot);
                const isBlocked = blocked.has(slot);

                return (
                  <button
                    key={slot}
                    onClick={() => handleToggleSlot(slot)}
                    disabled={isBooked || saving}
                    title={
                      isBooked ? 'Booked by a customer — cannot modify'
                      : isBlocked ? 'Click to make available again'
                      : 'Click to block this slot'
                    }
                    className={cn(
                      'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-medium transition-all',
                      isBooked
                        ? 'bg-primary-dim border-primary/30 text-primary cursor-not-allowed'
                        : isBlocked
                        ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
                        : 'bg-success/8 border-success/20 text-success hover:bg-success/15',
                      saving && 'opacity-60'
                    )}
                  >
                    <span>{slot}</span>
                    <span className="opacity-70">
                      {isBooked ? (
                        <Lock size={10} />
                      ) : isBlocked ? (
                        <Slash size={10} />
                      ) : (
                        <span className="text-[9px]">open</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
