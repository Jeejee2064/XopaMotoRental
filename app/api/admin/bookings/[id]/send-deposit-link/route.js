import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Returns the stable /pay/[bookingId]/auth?index=N link for an admin to copy
// and send (WhatsApp, email, however) — never a PagueloFacil URL directly,
// since that one expires in an hour (see app/api/pay/auth/route.js). Marks
// auth_link_sent_at/auth_status so the admin panel can show "link sent,
// awaiting customer" per bike index.
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { index = 0 } = await request.json().catch(() => ({}));

    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if ((booking.auth_count || 0) > index) {
      return NextResponse.json({ error: 'Deposit already authorized for this bike' }, { status: 400 });
    }

    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/pay/${id}/auth?index=${index}`;

    await supabase
      .from('bookings')
      .update({ auth_status: 'pending', auth_link_sent_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Error in POST /api/admin/bookings/[id]/send-deposit-link:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
