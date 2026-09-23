import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Sales funnel, in order. Each step's count = distinct sessions that fired
// that event at least once in the selected range — not a strict per-session
// sequence check, which is the right tradeoff for a small site's volume
// (simple to reason about, and still shows real drop-off between steps).
const MAIN_FUNNEL = [
  { key: 'visit', label: 'Visited site', match: (e) => e.event_type === 'page_view' },
  { key: 'booking_view', label: 'Opened booking form', match: (e) => e.event_type === 'page_view' && e.path?.includes('/booking') && !e.path?.includes('/booking/success') },
  { key: 'payment_initiated', label: 'Started payment', match: (e) => e.event_name === 'booking_payment_initiated' },
  { key: 'confirmed', label: 'Booking confirmed', match: (e) => e.event_name === 'booking_confirmed' }
];

const DEPOSIT_FUNNEL = [
  { key: 'auth_started', label: 'Deposit hold started', match: (e) => e.event_name === 'deposit_auth_started' },
  { key: 'auth_completed', label: 'Deposit hold confirmed', match: (e) => e.event_name === 'deposit_auth_completed' }
];

function buildFunnel(events, steps) {
  return steps.map((step) => {
    const sessions = new Set();
    for (const e of events) {
      if (step.match(e) && e.session_id) sessions.add(e.session_id);
    }
    return { key: step.key, label: step.label, count: sessions.size };
  });
}

function topN(events, filterFn, keyFn, n = 10) {
  const counts = new Map();
  for (const e of events) {
    if (!filterFn(e)) continue;
    const key = keyFn(e);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '30', 10) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, event_name, path, href, referrer, session_id, visitor_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(50000);

    if (error) {
      console.error('Error fetching analytics events:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const events = data || [];
    const pageViews = events.filter((e) => e.event_type === 'page_view');
    const linkClicks = events.filter((e) => e.event_type === 'link_click');

    const visitorIds = new Set(events.map((e) => e.visitor_id).filter(Boolean));
    const sessionIds = new Set(events.map((e) => e.session_id).filter(Boolean));

    // Page views per day, zero-filled across the range.
    const dayBuckets = new Map();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, 0);
    }
    for (const e of pageViews) {
      const key = e.created_at.slice(0, 10);
      if (dayBuckets.has(key)) dayBuckets.set(key, dayBuckets.get(key) + 1);
    }
    const pageViewsByDay = [...dayBuckets.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    const topPages = topN(pageViews, () => true, (e) => e.path || 'unknown').map((r) => ({ path: r.key, count: r.count }));

    const topReferrers = topN(
      pageViews,
      (e) => e.referrer && e.referrer !== 'unknown',
      (e) => {
        try {
          return new URL(e.referrer).hostname;
        } catch {
          return null;
        }
      }
    ).map((r) => ({ referrer: r.key, count: r.count }));

    const topLinkClicks = topN(linkClicks, () => true, (e) => e.href || 'unknown').map((r) => ({ href: r.key, count: r.count }));

    return NextResponse.json({
      days,
      totals: {
        pageViews: pageViews.length,
        linkClicks: linkClicks.length,
        uniqueVisitors: visitorIds.size,
        uniqueSessions: sessionIds.size
      },
      pageViewsByDay,
      topPages,
      topReferrers,
      topLinkClicks,
      mainFunnel: buildFunnel(events, MAIN_FUNNEL),
      depositFunnel: buildFunnel(events, DEPOSIT_FUNNEL)
    });
  } catch (err) {
    console.error('Error in GET /api/admin/analytics:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
