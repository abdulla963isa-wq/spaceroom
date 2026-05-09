'use client';

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

interface UseCollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useCollection<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): UseCollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionName) return;

    let unsubFirestore: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (!firebaseUser) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const q = constraints.length > 0
        ? query(collection(db, collectionName), ...constraints)
        : collection(db, collectionName);

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(docs);
          setLoading(false);
        },
        (err) => {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return { data, loading, error };
}
