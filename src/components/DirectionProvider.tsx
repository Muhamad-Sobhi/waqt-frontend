'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const isHome = pathname === '/';
    document.documentElement.dir = isHome ? 'ltr' : 'rtl';
    document.documentElement.lang = isHome ? 'en' : 'ar';
  }, [pathname]);

  return <>{children}</>;
}
