import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { generateCustomerEmailHTML } from '@/lib/emails/customerEmail';
import { generateCompanyEmailHTML } from '@/lib/emails/companyEmail';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);
const MODEL_LABEL = 'SPI RX250';

export async function POST(request) {
  const supabase = getSupabaseAdmin();

  try {
    const data = await request.json();
    console.log('PagueloFacil webhook received:', JSON.stringify(data, null, 2));

    const { status, codOper, messageSys, customFields = {} } = data;
    const bookingId = customFields['Booking ID'];
    const securityToken = customFields['Security Token'];

    if (!bookingId || !securityToken) {
      console.error('Missing booking ID or token', customFields);
      return NextResponse.json({ error: 'Missing booking ID or token' }, { status: 400 });
    }

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('paguelofacil_token', securityToken)
      .single();

    if (fetchError || !booking) {
      console.error('Booking not found or token mismatch:', fetchError);
      return NextResponse.json({ error: 'Invalid booking' }, { status: 404 });
    }

    if (booking.webhook_received) {
      console.log('Webhook already processed:', bookingId);
      return NextResponse.json({ status: 'already_processed' });
    }

    const approved = status === 1 || status === '1';

    if (!approved) {
      await supabase
        .from('bookings')
        .update({
          status: 'failed',
          payment_status: 'failed',
          webhook_received: true,
          pending_verification: false,
          paguelofacil_transaction_id: codOper
        })
        .eq('id', bookingId);

      return NextResponse.json({ status: 'payment_failed', message: messageSys });
    }

    // Full amount paid online — no remaining balance (see create-paguelofacil-payment/route.js).
    await supabase
      .from('bookings')
      .update({
        status: 'fully paid',
        payment_status: 'paid',
        paid: true,
        webhook_received: true,
        pending_verification: false,
        paguelofacil_transaction_id: codOper
      })
      .eq('id', bookingId);

    const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();

    // Single model/location — assignment is just "first N available bikes",
    // no Coronado-style location branching needed.
    const startDate = new Date(updatedBooking.start_date);
    const endDate = new Date(updatedBooking.end_date);

    const { data: overlappingBookings } = await supabase
      .from('bookings')
      .select(`id, start_date, end_date, booking_motorcycles ( motorcycle_id )`)
      .in('status', ['confirmed', 'paid', 'fully paid']);

    const bookedMotorcycleIds = new Set();
    overlappingBookings?.forEach((b) => {
      if (b.id === bookingId) return;
      const bStart = new Date(b.start_date);
      const bEnd = new Date(b.end_date);
      if (startDate <= bEnd && endDate >= bStart) {
        b.booking_motorcycles?.forEach((m) => bookedMotorcycleIds.add(m.motorcycle_id));
      }
    });

    const { data: fleetMotorcycles } = await supabase
      .from('motorcycles')
      .select('*')
      .eq('model', siteConfig.fleet.model)
      .eq('location', siteConfig.fleet.location)
      .eq('is_available', true)
      .order('name');

    const available = (fleetMotorcycles || []).filter((m) => !bookedMotorcycleIds.has(m.id));
    const assigned = available.slice(0, updatedBooking.bike_quantity);
    const hasShortage = assigned.length < updatedBooking.bike_quantity;

    if (hasShortage) {
      console.error(
        `Only ${assigned.length} of ${updatedBooking.bike_quantity} bikes could be assigned for booking ${bookingId}`
      );
      await supabase.from('bookings').update({ assignment_shortage: true }).eq('id', bookingId);
    }

    for (const moto of assigned) {
      await supabase.from('booking_motorcycles').insert({ booking_id: bookingId, motorcycle_id: moto.id });
    }

    const { data: additionalRiders } = await supabase
      .from('booking_riders')
      .select('*')
      .eq('booking_id', bookingId)
      .order('rider_index');

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [updatedBooking.email],
        subject: `🏍️ Reserva confirmada — ${MODEL_LABEL}`,
        html: generateCustomerEmailHTML(updatedBooking, assigned, MODEL_LABEL)
      });
    } catch (e) {
      console.error('Customer email failed', e);
    }

    for (const rider of additionalRiders || []) {
      if (!rider.email) continue;
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [rider.email],
          subject: `🏍️ Reserva confirmada — ${MODEL_LABEL}`,
          html: generateCustomerEmailHTML(
            { ...updatedBooking, first_name: rider.first_name, last_name: rider.last_name, email: rider.email },
            assigned,
            MODEL_LABEL
          )
        });
      } catch (e) {
        console.error(`Rider email failed for ${rider.email}`, e);
      }
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [siteConfig.adminNotificationEmail],
        subject: `🚨 Nueva reserva — ${updatedBooking.first_name} ${updatedBooking.last_name} — ${MODEL_LABEL}${
          hasShortage ? ' ⚠️ FALTAN MOTOS' : ''
        }`,
        html: generateCompanyEmailHTML(updatedBooking, assigned, MODEL_LABEL, hasShortage)
      });
    } catch (e) {
      console.error('Admin email failed', e);
    }

    console.log('Webhook processed successfully');
    return NextResponse.json({ status: 'success', bookingId, transactionId: codOper });
  } catch (err) {
    console.error('Webhook fatal error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
