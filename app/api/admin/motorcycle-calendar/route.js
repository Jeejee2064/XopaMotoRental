import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Powers the admin calendar (components/MotorcycleCalendar.js). Merges the
// `motorcycle_calendar` view with booking/rider contact details (phone,
// email, name) — customer PII the anon key has no table access to (RLS).
export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('motorcycle_calendar')
      .select('*')
      .order('motorcycle_name', { ascending: true })
      .order('start_date', { ascending: true });

    if (startDate && endDate) {
      query = query.lte('start_date', endDate).gte('end_date', startDate);
    }

    const { data: calendarData, error: calendarError } = await query;
    if (calendarError) {
      console.error('Error fetching motorcycle calendar:', calendarError);
      return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
    }

    if (!calendarData || calendarData.length === 0) {
      return NextResponse.json({ calendar: [] });
    }

    const bookingIds = calendarData.map((event) => event.booking_id).filter(Boolean);

    const [{ data: bookingsData }, { data: ridersData }, { data: motoAssignments }] = await Promise.all([
      supabase.from('bookings').select('id, phone, email, first_name, last_name, pickup_location, special_requests, important_note').in('id', bookingIds),
      supabase.from('booking_riders').select('booking_id, rider_index, first_name, last_name, email, phone').in('booking_id', bookingIds).order('rider_index'),
      supabase.from('booking_motorcycles').select('booking_id, motorcycle_id').in('booking_id', bookingIds).order('motorcycle_id'),
    ]);

    const bookingsMap = Object.fromEntries((bookingsData || []).map((b) => [b.id, b]));

    // For each booking, ordered list of motorcycle_ids (sorted by motorcycle_id)
    const bookingMotoOrder = {};
    for (const row of motoAssignments || []) {
      if (!bookingMotoOrder[row.booking_id]) bookingMotoOrder[row.booking_id] = [];
      bookingMotoOrder[row.booking_id].push(row.motorcycle_id);
    }

    // Map booking_id -> array indexed by position: [{ name, phone, email }, ...]
    // index 0 = primary booker, index 1 = rider_index 2, etc.
    const bookingRiderInfo = {};
    for (const booking of bookingsData || []) {
      bookingRiderInfo[booking.id] = [{
        name: `${booking.first_name} ${booking.last_name}`,
        phone: booking.phone || null,
        email: booking.email || null,
      }];
    }
    for (const rider of ridersData || []) {
      if (!bookingRiderInfo[rider.booking_id]) bookingRiderInfo[rider.booking_id] = [];
      bookingRiderInfo[rider.booking_id][rider.rider_index - 1] = {
        name: `${rider.first_name} ${rider.last_name}`,
        phone: rider.phone || null,
        email: rider.email || null,
      };
    }

    const mergedData = calendarData.map((event) => {
      const booking = bookingsMap[event.booking_id];
      const motoOrder = bookingMotoOrder[event.booking_id] || [];
      const motoIdx = motoOrder.indexOf(event.motorcycle_id);
      const riders = bookingRiderInfo[event.booking_id] || [];
      const rider = (motoIdx >= 0 && riders[motoIdx]) ? riders[motoIdx] : (riders[0] || null);
      return {
        ...event,
        display_name: rider?.name || event.customer_name || null,
        phone: rider?.phone || booking?.phone || null,
        display_email: rider?.email || booking?.email || null,
        all_rider_names: riders.map((r) => r?.name).filter(Boolean),
        special_requests: booking?.special_requests || null,
        important_note: booking?.important_note || false,
      };
    });

    return NextResponse.json({ calendar: mergedData });
  } catch (err) {
    console.error('Error in GET /api/admin/motorcycle-calendar:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
