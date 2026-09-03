import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';

export const runtime = 'nodejs';

// Whitelist of booking fields the admin dashboard is allowed to write through
// this generic endpoint (covers status/payment updates and the edit form).
const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'country',
  'start_date', 'end_date', 'bike_quantity',
  'total_price', 'down_payment', 'deposit', 'special_requests', 'important_note', 'hear_about_us',
  'status', 'payment_status', 'webhook_received',
  'paid',
];

async function requireAdmin(request) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const { valid } = await verifyAdminSessionToken(token);
  return valid;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    return NextResponse.json({ booking: data });
  } catch (err) {
    console.error('Error in PATCH /api/admin/bookings/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
    }
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/admin/bookings/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
