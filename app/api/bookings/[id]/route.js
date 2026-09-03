import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Full booking record + assigned motorcycles — powers the internal booking
// share page (app/[locale]/admin/ok/bookings/[id]). Admin-session gated,
// unlike app/api/bookings/[id]/confirmation (public, success-page fields only).
export async function GET(request, { params }) {
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

    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: bookingMotorcycles } = await supabase
      .from('booking_motorcycles')
      .select('motorcycle_id, motorcycles ( id, name, model )')
      .eq('booking_id', id);

    const assigned = (bookingMotorcycles || []).map((bm) => bm.motorcycles).filter(Boolean);

    return NextResponse.json({ booking, assigned });
  } catch (err) {
    console.error('Error fetching booking:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
