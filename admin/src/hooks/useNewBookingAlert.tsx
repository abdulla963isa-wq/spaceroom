'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Venue, Booking } from '@/types';
import { createNotificationById } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { CalendarCheck, X } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export function useNewBookingAlert(ownerId: string | null) {
  const knownBookingIds = useRef<Set<string>>(new Set());
  const bookingUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!ownerId) return;

    const venuesQuery = query(
      collection(db, 'venues'),
      where('ownerId', '==', ownerId)
    );

    const unsubVenues = onSnapshot(venuesQuery, (venueSnapshot) => {
      // Clean up previous bookings listener
      if (bookingUnsubRef.current) {
        bookingUnsubRef.current();
        bookingUnsubRef.current = null;
      }

      const venueIds = venueSnapshot.docs.map((d) => d.id);
      if (venueIds.length === 0) return;

      const batchIds = venueIds.slice(0, 10);
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('venueId', 'in', batchIds)
      );

      let isFirstLoad = true;

      bookingUnsubRef.current = onSnapshot(bookingsQuery, (snapshot) => {
        if (isFirstLoad) {
          // Populate known IDs without alerting on initial load
          snapshot.docs.forEach((d) => knownBookingIds.current.add(d.id));
          isFirstLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (
            change.type === 'added' &&
            !knownBookingIds.current.has(change.doc.id)
          ) {
            knownBookingIds.current.add(change.doc.id);
            const booking = { id: change.doc.id, ...change.doc.data() } as Booking;
            if (booking.isOwnerBlock) return;

            // Show popup toast
            toast.custom(
              (t) => (
                <div
                  className={`flex items-start gap-3 p-4 bg-surface border border-primary/40 rounded-2xl shadow-2xl w-80 transition-all duration-300 ${
                    t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-dim flex items-center justify-center flex-shrink-0">
                    <CalendarCheck size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">New Booking!</p>
                    <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">
                      {booking.spaceName}
                    </p>
                    <p className="text-text-muted text-xs">
                      {formatDate(booking.date)} · {booking.startTime}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-success text-xs font-semibold">
                        {formatCurrency(booking.total)}
                      </span>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          window.location.href = `/owner/bookings?bookingId=${booking.id}`;
                        }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        View →
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="text-text-muted hover:text-white transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ),
              { duration: 8000, position: 'top-right' }
            );

            // Persist notification in Firestore (idempotent via fixed doc ID)
            createNotificationById(
              `booking_alert_${booking.id}`,
              ownerId,
              'owner',
              'New Booking Received',
              `${booking.spaceName} booked for ${formatDate(booking.date)} at ${booking.startTime}`,
              'booking',
              { bookingId: booking.id }
            ).catch(console.error);
          }
        });
      });
    });

    return () => {
      unsubVenues();
      if (bookingUnsubRef.current) {
        bookingUnsubRef.current();
        bookingUnsubRef.current = null;
      }
      knownBookingIds.current.clear();
    };
  }, [ownerId]);
}
