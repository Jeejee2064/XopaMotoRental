import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Read assigned/available motorcycles for a booking.
//   ?type=assigned                                          -> currently assigned motorcycles
//   ?type=available&start_date=&end_date=                   -> open motorcycles for those dates
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
    const { data: booking, error: bookingError } = await supabase
      .from('bookings').select('id').eq('id', id).single();
    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'assigned';

    if (type === 'assigned') {
      // booking_motorcycles has no surrogate `id` — its primary key is the
      // (booking_id, motorcycle_id) pair (see supabase/schema.sql) — so the
      // motorcycle_id itself is what identifies an assignment row.
      const { data, error } = await supabase
        .from('booking_motorcycles')
        .select(`motorcycle_id, motorcycles ( id, name )`)
        .eq('booking_id', id);
      if (error) throw error;
      return NextResponse.json({ assigned: data || [] });
    }

    // type === 'available'
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing start_date/end_date' }, { status: 400 });
    }

    const { data: allMotorcycles, error: motoError } = await supabase
      .from('motorcycles').select('*').order('name', { ascending: true });
    if (motoError) throw motoError;

    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`id, booking_motorcycles ( motorcycle_id )`)
      .in('status', ['confirmed', 'pending', 'fully paid'])
      .neq('id', id)
      .lte('start_date', endDate)
      .gte('end_date', startDate);
    if (overlapError) throw overlapError;

    const bookedIds = new Set(
      (overlappingBookings || []).flatMap((b) => b.booking_motorcycles?.map((bm) => bm.motorcycle_id) ?? [])
    );
    const available = (allMotorcycles || []).filter((m) => !bookedIds.has(m.id));

    return NextResponse.json({ available });
  } catch (err) {
    console.error('Error in GET /api/admin/bookings/[id]/motorcycles:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Swap a single motorcycle assignment slot on a booking.
export async function PATCH(request, { params }) {
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
    const { data: booking, error: bookingError } = await supabase
      .from('bookings').select('id').eq('id', id).single();
    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // `oldAssignmentId` here is the motorcycle_id being replaced — there's no
    // surrogate id on booking_motorcycles, so booking_id + motorcycle_id is
    // the row identifier.
    const { oldAssignmentId, newMotorcycleId } = await request.json();

    if (oldAssignmentId) {
      const { error: deleteError } = await supabase
        .from('booking_motorcycles')
        .delete()
        .eq('booking_id', id)
        .eq('motorcycle_id', oldAssignmentId);
      if (deleteError) throw deleteError;
    }

    if (newMotorcycleId) {
      const { error: insertError } = await supabase
        .from('booking_motorcycles')
        .insert({ booking_id: id, motorcycle_id: newMotorcycleId });
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in PATCH /api/admin/bookings/[id]/motorcycles:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
