'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { trackPageView, trackLinkClick } from '@/lib/analytics/track';

// Mounted once in the root layout. Tracks two things site-wide with no
// per-page wiring needed:
//  - a page_view on every route change (covers the whole browsing funnel:
//    fleet, pricing, how-it-works, booking, etc.)
//  - a link_click on every <a> click anywhere on the site (internal nav and
//    outbound links alike), captured via a single delegated listener.
// Admin routes are excluded so admin activity doesn't pollute visitor
// analytics.
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    if (pathname?.includes('/admin')) return;
    trackPageView({
      path: pathname + (typeof window !== 'undefined' ? window.location.search : ''),
      locale,
      referrer: typeof document !== 'undefined' ? document.referrer : ''
    });
  }, [pathname, locale]);

  useEffect(() => {
    if (pathname?.includes('/admin')) return;

    const handleClick = (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      trackLinkClick({
        href,
        path: pathname,
        locale,
        metadata: {
          text: (link.textContent || '').trim().slice(0, 120),
          external: /^https?:\/\//.test(href) && !href.includes(typeof window !== 'undefined' ? window.location.host : '')
        }
      });
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname, locale]);

  return null;
}
