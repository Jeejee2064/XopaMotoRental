import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { generateCustomerEmailHTML } from '@/lib/emails/customerEmail';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);
const MODEL_LABEL = 'SPI RX250';

// Re-sends the same confirmation email the customer (and any additional
// riders with an email on file) got when the booking was first paid — for
// when they lost it or an admin-created booking never triggered the webhook.
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

    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase.from('bookings').select('*').eq('id', id).single();
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const { data: bookingMotorcycles } = await supabase
      .from('booking_motorcycles')
      .select('motorcycles ( id, name )')
      .eq('booking_id', id);
    const assigned = (bookingMotorcycles || []).map((bm) => bm.motorcycles).filter(Boolean);

    const { data: riders } = await supabase
      .from('booking_riders')
      .select('*')
      .eq('booking_id', id)
      .order('rider_index');

    const recipients = [
      { email: booking.email, first_name: booking.first_name, last_name: booking.last_name },
      ...(riders || []).filter((r) => r.email).map((r) => ({ email: r.email, first_name: r.first_name, last_name: r.last_name })),
    ];

    for (const recipient of recipients) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [recipient.email],
        subject: `🏍️ Reserva confirmada — ${MODEL_LABEL}`,
        html: generateCustomerEmailHTML(
          { ...booking, first_name: recipient.first_name, last_name: recipient.last_name, email: recipient.email },
          assigned,
          MODEL_LABEL
        ),
      });
    }

    return NextResponse.json({ success: true, sentTo: recipients.length });
  } catch (err) {
    console.error('Error in POST /api/admin/bookings/[id]/resend-confirmation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
