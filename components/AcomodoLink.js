'use client';

import { acomodoRentals } from '@/lib/site-config';

// Wraps the Acomodo Rentals referral link with click tracking: fires a
// best-effort beacon to our API route (which emails the admin) without ever
// delaying or blocking the tab opening via target="_blank".
export default function AcomodoLink({ source, className, children }) {
  const handleClick = () => {
    try {
      fetch('/api/track-partner-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ source })
      }).catch(() => {});
    } catch {
      // Tracking must never block the visitor's navigation.
    }
  };

  return (
    <a href={acomodoRentals.href} target="_blank" rel="noopener noreferrer" onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
