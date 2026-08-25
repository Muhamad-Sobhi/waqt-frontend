'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ActiveOffer } from '@/lib/pricing';

const OfferContext = createContext<{ offer: ActiveOffer | null, loading: boolean }>({ offer: null, loading: true });

export function OfferProvider({ children }: { children: React.ReactNode }) {
  const [offer, setOffer] = useState<ActiveOffer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const q = query(collection(db, 'offers'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        let activeOffer = null;
        const now = new Date();
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const endDate = new Date(data.endDate.seconds * 1000);
          if (endDate > now) {
            activeOffer = { id: doc.id, ...data } as ActiveOffer;
            break;
          }
        }
        
        setOffer(activeOffer);
      } catch (error) {
        console.error('Error fetching active offer:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOffer();
  }, []);

  return (
    <OfferContext.Provider value={{ offer, loading }}>
      {children}
    </OfferContext.Provider>
  );
}

export function useActiveOffer() {
  return useContext(OfferContext);
}
