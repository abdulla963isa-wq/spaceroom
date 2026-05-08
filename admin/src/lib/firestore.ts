import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Notification, User, Booking } from '@/types';

// Real-time collection listener
export function getCollection(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  callback: (data: Record<string, unknown>[]) => void
) {
  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : collection(db, collectionName);

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(data as Record<string, unknown>[]);
  });
}

// Get a single document by ID
export async function getDocById(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

// Update a document
export async function updateDoc(collectionName: string, id: string, data: Record<string, unknown>) {
  const docRef = doc(db, collectionName, id);
  await firestoreUpdateDoc(docRef, data);
}

// Delete a document
export async function deleteDoc(collectionName: string, id: string) {
  const docRef = doc(db, collectionName, id);
  await firestoreDeleteDoc(docRef);
}

// Create a new document with auto-generated ID
export async function createDoc(collectionName: string, data: Record<string, unknown>) {
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

// Create or set a document with specific ID
export async function setDocById(collectionName: string, id: string, data: Record<string, unknown>) {
  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, { ...data, createdAt: serverTimestamp() }, { merge: true });
}

// Create a notification
export async function createNotification(
  receiverId: string,
  receiverRole: Notification['receiverRole'],
  title: string,
  message: string,
  type: Notification['type'],
  metadata?: Record<string, unknown>
) {
  const notifData: Omit<Notification, 'id'> = {
    receiverId,
    receiverRole,
    title,
    message,
    type,
    isRead: false,
    createdAt: serverTimestamp() as unknown as string,
    ...(metadata && { metadata }),
  };
  return createDoc('notifications', notifData as unknown as Record<string, unknown>);
}

// Get users by role
export async function getUsersByRole(role: User['role']): Promise<User[]> {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
}

// Get bookings by venue ID
export function getBookingsByVenue(
  venueId: string,
  callback: (bookings: Booking[]) => void
) {
  const q = query(collection(db, 'bookings'), where('venueId', '==', venueId));
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Booking));
    callback(bookings);
  });
}

// Get bookings by owner (joins bookings where venueId in owner's venues)
export async function getBookingsByOwner(ownerId: string): Promise<Booking[]> {
  // First get all venues by this owner
  const venuesQuery = query(collection(db, 'venues'), where('ownerId', '==', ownerId));
  const venuesSnapshot = await getDocs(venuesQuery);
  const venueIds = venuesSnapshot.docs.map((doc) => doc.id);

  if (venueIds.length === 0) return [];

  // Get bookings for each venue (Firestore doesn't support IN queries > 10, batch if needed)
  const batchSize = 10;
  const allBookings: Booking[] = [];

  for (let i = 0; i < venueIds.length; i += batchSize) {
    const batch = venueIds.slice(i, i + batchSize);
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('venueId', 'in', batch)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    bookingsSnapshot.docs.forEach((doc) => {
      allBookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
  }

  return allBookings;
}

// Real-time listener for owner's notifications
export function getOwnerNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  const q = query(
    collection(db, 'notifications'),
    where('receiverId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Notification))
      .sort((a, b) => {
        const aTime = typeof a.createdAt === 'object' && a.createdAt && 'toDate' in a.createdAt
          ? (a.createdAt as { toDate: () => Date }).toDate().getTime()
          : new Date(a.createdAt as string).getTime();
        const bTime = typeof b.createdAt === 'object' && b.createdAt && 'toDate' in b.createdAt
          ? (b.createdAt as { toDate: () => Date }).toDate().getTime()
          : new Date(b.createdAt as string).getTime();
        return bTime - aTime;
      });
    callback(notifications);
  });
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
  const docRef = doc(db, 'notifications', notificationId);
  await firestoreUpdateDoc(docRef, { isRead: true });
}

// Mark all notifications as read for a user
export async function markAllNotificationsRead(userId: string) {
  const q = query(
    collection(db, 'notifications'),
    where('receiverId', '==', userId),
    where('isRead', '==', false)
  );
  const snapshot = await getDocs(q);
  const promises = snapshot.docs.map((doc) =>
    firestoreUpdateDoc(doc.ref, { isRead: true })
  );
  await Promise.all(promises);
}

// Normalize legacy venue names across all booking documents
export async function migrateVenueNames(): Promise<number> {
  const VENUE_NAME_MAP: Record<string, string> = {
    'Diwan Hub, Adliya': 'Diwan Studio',
    'Diwan Hub': 'Diwan Studio',
    'Savoy Grande': 'Savoy Grande Hotel',
  };

  const snapshot = await getDocs(collection(db, 'bookings'));
  const updates: Promise<void>[] = [];

  snapshot.docs.forEach((bookingDoc) => {
    const venueName = bookingDoc.data().venueName as string | undefined;
    if (venueName && VENUE_NAME_MAP[venueName]) {
      updates.push(
        firestoreUpdateDoc(bookingDoc.ref, { venueName: VENUE_NAME_MAP[venueName] })
      );
    }
  });

  await Promise.all(updates);
  return updates.length;
}

// Cancel a booking and notify the user
export async function cancelBooking(bookingId: string, userId: string, spaceName: string, date: string) {
  const bookingRef = doc(db, 'bookings', bookingId);
  await firestoreUpdateDoc(bookingRef, { status: 'Cancelled' });

  // Create notification for the user
  await createNotification(
    userId,
    'customer',
    'Booking Cancelled',
    `Your booking for ${spaceName} on ${date} has been cancelled by the administrator.`,
    'booking',
    { bookingId }
  );
}
