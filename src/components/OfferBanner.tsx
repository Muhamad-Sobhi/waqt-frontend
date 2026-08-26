'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePathname } from 'next/navigation';

export default function OfferBanner() {
  const [offer, setOffer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        // Fetch active offers
        const q = query(
          collection(db, 'offers'), 
          where('isActive', '==', true)
        );
        const snapshot = await getDocs(q);
        
        let activeOffer = null;
        const now = new Date();
        
        // Find the first valid offer that hasn't expired
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const endDate = new Date(data.endDate.seconds * 1000);
          if (endDate > now) {
            activeOffer = { id: doc.id, ...data };
            break;
          }
        }
        
        setOffer(activeOffer);
      } catch (error) {
        console.error('Error fetching offer for banner:', error);
      }
    };
    
    fetchOffer();
  }, []);

  useEffect(() => {
    if (!offer) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(offer.endDate.seconds * 1000).getTime();
      const distance = endTime - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft(null);
        setOffer(null); // Hide banner when expired
        return;
      }

      setTimeLeft({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [offer]);

  if (!offer || !timeLeft) return null;

  let discountText = '';
  if (offer.type === 'percentage') {
    discountText = isHome ? `${offer.value}% OFF` : `خصم ${offer.value}%`;
  } else if (offer.type === 'fixed') {
    discountText = isHome ? `${offer.value} EGP OFF` : `خصم ${offer.value} جنيه`;
  } else if (offer.type === 'free_shipping') {
    discountText = isHome ? `SPECIAL OFFER` : `عروض حصرية`;
  }

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white py-2 px-4 relative z-[60] shadow-md border-b border-red-700/50 flex justify-center items-center">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-sm sm:text-base font-bold w-full">
        
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl animate-pulse">🎁</span>
          <span className="tracking-wide">{offer.title}</span>
          <span className="mx-2 hidden sm:inline text-gray-500">|</span>
        </div>
        
        <div className="bg-white text-red-600 px-3 py-1 rounded-full border border-red-200 uppercase tracking-widest text-xs font-black shadow-sm animate-pulse" style={{ animationDuration: '2s' }}>
          {discountText}
        </div>
        
        <div className="flex items-center gap-1.5 font-mono bg-black/20 px-3 py-1 rounded-lg shadow-inner" dir="ltr">
          <span className="text-white/80 text-xs mr-1 font-sans uppercase">{isHome ? 'Ends In:' : 'ينتهي في:'}</span>
          {timeLeft.d > 0 && <span className="text-white font-bold">{timeLeft.d}d</span>}
          <span className="text-white font-bold">{timeLeft.h.toString().padStart(2, '0')}h</span>
          <span className="text-white font-bold">:</span>
          <span className="text-white font-bold">{timeLeft.m.toString().padStart(2, '0')}m</span>
          <span className="text-white font-bold">:</span>
          <span className="text-white font-bold">{timeLeft.s.toString().padStart(2, '0')}s</span>
        </div>

      </div>
    </div>
  );
}
