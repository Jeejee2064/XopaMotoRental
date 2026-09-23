import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

export const runtime = 'nodejs';

const EVENT_TYPES = new Set(['page_view', 'link_click', 'funnel_step']);
const MAX_LEN = 500;

const clip = (v) => (typeof v === 'string' ? v.slice(0, MAX_LEN) : null);

// Best-effort behavior tracking (page views, link clicks, sales-funnel
// steps). Never surfaces failure to the visitor and never logs IP/user-agent
// — see supabase/schema.sql's analytics_events comment for the reasoning,
// same no-PII stance as app/api/track-partner-click.
export async function POST(request) {
  try {
    const body = await request.json();

    if (typeof body?.type !== 'string' || !EVENT_TYPES.has(body.type)) {
      return NextResponse.json({ success: false }, { status: 200 });
    }
    if (typeof body?.session_id !== 'string' || !body.session_id) {
      return NextResponse.json({ success: false }, { status: 200 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('analytics_events').insert({
      event_type: body.type,
      event_name: clip(body.name) || body.type,
      path: clip(body.path),
      locale: clip(body.locale),
      href: clip(body.href),
      referrer: clip(body.referrer),
      session_id: clip(body.session_id),
      visitor_id: clip(body.visitor_id),
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : null
    });

    if (error) {
      console.error('Error inserting analytics event:', error);
    }

    return NextResponse.json({ success: !error });
  } catch (err) {
    console.error('Error in POST /api/track-event:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
