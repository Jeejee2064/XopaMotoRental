import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

// Public, unauthenticated — the booking UUID itself is the capability token
// (same pattern as Overland). Only returns the fields the success page needs,
// never the customer's email/phone/PagueloFacil tokens.
export async function GET(request, { params }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, first_name, status, payment_status, start_date, end_date, bike_quantity, motorcycle_model, pickup_location, total_price, deposit')
    .eq('id', id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
