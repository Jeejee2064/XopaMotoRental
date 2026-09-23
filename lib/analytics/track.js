'use client';

// Lightweight client-side event tracking. Fires a best-effort beacon to
// /api/track-event — never throws, never blocks navigation, and never awaited
// by callers. Two ids group events:
//  - visitor_id: random, stored in localStorage, survives across tab sessions
//    (repeat-visitor counting).
//  - session_id: random, stored in sessionStorage, cleared when the tab
//    closes (funnel/session grouping).
// Neither is derived from IP/user-agent/fingerprinting — same no-PII stance
// as app/api/track-partner-click.

const VISITOR_KEY = 'xopa_visitor_id';
const SESSION_KEY = 'xopa_session_id';

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateId(storage, key) {
  try {
    let id = storage.getItem(key);
    if (!id) {
      id = randomId();
      storage.setItem(key, id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode, blocked cookies, etc.) — fall back
    // to a per-call id rather than breaking tracking entirely.
    return randomId();
  }
}

export function getVisitorId() {
  if (typeof window === 'undefined') return null;
  return getOrCreateId(window.localStorage, VISITOR_KEY);
}

export function getSessionId() {
  if (typeof window === 'undefined') return null;
  return getOrCreateId(window.sessionStorage, SESSION_KEY);
}

function send(payload) {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch {
    // Tracking must never block or throw for the visitor.
  }
}

export function trackPageView({ path, locale, referrer }) {
  send({
    type: 'page_view',
    name: 'page_view',
    path,
    locale,
    referrer,
    session_id: getSessionId(),
    visitor_id: getVisitorId()
  });
}

export function trackLinkClick({ href, path, locale, metadata }) {
  send({
    type: 'link_click',
    name: 'link_click',
    href,
    path,
    locale,
    metadata,
    session_id: getSessionId(),
    visitor_id: getVisitorId()
  });
}

export function trackFunnelStep(name, { path, locale, metadata } = {}) {
  send({
    type: 'funnel_step',
    name,
    path,
    locale,
    metadata,
    session_id: getSessionId(),
    visitor_id: getVisitorId()
  });
}
