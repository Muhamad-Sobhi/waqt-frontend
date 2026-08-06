'use client';

import { useEffect, useRef } from 'react';

function generateSessionId(): string {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('waqt-session-id');
  if (!sid) {
    sid = generateSessionId();
    localStorage.setItem('waqt-session-id', sid);
  }
  return sid;
}

export function SessionTracker() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const sessionId = getSessionId();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    // Track session start
    fetch(`${apiUrl}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        deviceInfo: navigator.userAgent,
        ipAddress: 'client',
      }),
    }).catch(() => {
      // Silent fail - don't block user experience
    });
  }, []);

  return null;
}

export function trackProductVisit(productId: string) {
  const sessionId = getSessionId();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  fetch(`${apiUrl}/api/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      visitedProductId: productId,
    }),
  }).catch(() => {
    // Silent fail
  });
}
