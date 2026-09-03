import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';

// List all bookings (+ riders) for the admin dashboard. Uses the service-role
// client server-side — `bookings` has no anon SELECT policy (RLS, see
// supabase/schema.sql), it holds customer PII.
export async function GET(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bookings')
      .select('*, booking_riders(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (err) {
    console.error('Error in GET /api/admin/bookings:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Admin manual "Add Booking" flow — Xopa is single model/location, so this is
// a straight "first N available bikes" assignment (no Overland-style
// location branching/fallback needed).
export async function POST(request) {
  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const { valid } = await verifyAdminSessionToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newBooking, riders = [] } = await request.json();
    if (!newBooking) {
      return NextResponse.json({ error: 'Missing booking data' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const startDate = new Date(newBooking.start_date);
    const endDate = new Date(newBooking.end_date);
    const needed = newBooking.bike_quantity || 1;

    // 1. Which motorcycles are already committed to an overlapping booking
    const { data: overlappingBookings, error: overlapError } = await supabase
      .from('bookings')
      .select(`id, start_date, end_date, booking_motorcycles ( motorcycle_id )`)
      .in('status', ['confirmed', 'pending', 'fully paid']);
    if (overlapError) throw overlapError;

    const bookedMotorcycleIds = new Set();
    for (const b of overlappingBookings) {
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      const overlaps = startDate <= bEnd && endDate >= bStart;
      if (overlaps && b.booking_motorcycles?.length) {
        for (const bm of b.booking_motorcycles) bookedMotorcycleIds.add(bm.motorcycle_id);
      }
    }

    const { data: fleetMotorcycles, error: motoError } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('model', siteConfig.fleet.model)
      .eq('location', siteConfig.fleet.location)
      .eq('is_available', true)
      .order('name');
    if (motoError) throw motoError;

    const available = (fleetMotorcycles || []).filter((m) => !bookedMotorcycleIds.has(m.id));

    if (available.length < needed) {
      return NextResponse.json(
        { error: `Not enough bikes available (needed ${needed}, available ${available.length}).` },
        { status: 400 }
      );
    }

    // 2. Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([{
        first_name: newBooking.first_name,
        last_name: newBooking.last_name,
        email: newBooking.email,
        phone: newBooking.phone,
        country: newBooking.country,
        start_date: newBooking.start_date,
        end_date: newBooking.end_date,
        bike_quantity: needed,
        motorcycle_model: siteConfig.fleet.model,
        pickup_location: siteConfig.fleet.location,
        total_price: newBooking.total_price,
        down_payment: newBooking.down_payment,
        deposit: newBooking.deposit,
        special_requests: newBooking.special_requests || null,
        important_note: newBooking.important_note || false,
        hear_about_us: newBooking.hear_about_us || null,
        status: newBooking.status || 'confirmed',
        payment_status: newBooking.payment_status || 'pending',
        paid: newBooking.paid || false,
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking: ' + bookingError.message }, { status: 500 });
    }

    // 3. Assign motorcycles (only if the booking is being created as already confirmed)
    if (newBooking.status === 'confirmed' || newBooking.status === 'fully paid') {
      const assigned = available.slice(0, needed);
      for (const moto of assigned) {
        const { error: assignError } = await supabase
          .from('booking_motorcycles')
          .insert({ booking_id: booking.id, motorcycle_id: moto.id });
        if (assignError) throw new Error('Failed to assign motorcycles: ' + assignError.message);
      }
    }

    // 4. Additional riders
    const validRiders = (riders || []).filter((r) => r.first_name && r.last_name);
    if (validRiders.length > 0) {
      const { error: ridersError } = await supabase
        .from('booking_riders')
        .insert(validRiders.map((r, i) => ({
          booking_id: booking.id,
          rider_index: i + 2,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email || null,
          phone: r.phone || null,
        })));
      if (ridersError) console.error('Error inserting riders:', ridersError);
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('Error in POST /api/admin/bookings:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
