import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);
const DEPOSIT_PER_BIKE = 375;

// Confirms a deposit AUTH hold once the customer's browser lands back on
// /pay/auth-success — PagueloFacil's account-level webhook can't be reused
// for this (its PF_CF payload has no 'Security Token' field for AUTH
// transactions, so it 400s and no-ops on them by construction, same as
// Overland's reference implementation). This route is reachable straight
// from the browser, so `token` — the same paguelofacil_token minted in
// /api/pay/auth — is the only thing standing between this and anyone
// guessing a bookingId; treat it as the auth check, not a formality.
function depositConfirmationEmailHTML({ firstName, index, bikeQuantity, allDone }) {
  const label = bikeQuantity > 1 ? `Depósito #${index + 1} de ${bikeQuantity}` : 'Depósito de garantía';
  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #050507; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f3f3f3;">
      <div style="background: #ffffff;">
        <div style="background: #F80293; color: #ffffff; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase;">🔒 Depósito autorizado</h1>
        </div>
        <div style="padding: 28px 26px;">
          <p>¡Gracias, ${firstName}!</p>
          <p><strong>${label}</strong> de $${DEPOSIT_PER_BIKE.toFixed(2)} quedó autorizado en tu tarjeta — es una <strong>retención</strong>, no un cobro. Se libera automáticamente si la moto se devuelve sin daños.</p>
          ${
            allDone
              ? '<p>Con esto, todos los depósitos de tu reserva están autorizados. ¡Nos vemos pronto!</p>'
              : '<p>Te enviaremos un enlace aparte para el resto de los depósitos si aplica.</p>'
          }
        </div>
        <div style="background: #050507; color: #ebebeb; padding: 22px; text-align: center; font-size: 13px;">
          ${siteConfig.companyName} · ${siteConfig.phone}
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function POST(request) {
  const supabase = getSupabaseAdmin();

  try {
    const { bookingId, type, codOper, totalPaid, token } = await request.json();

    if (!bookingId || !token) {
      return NextResponse.json({ error: 'Missing bookingId or token' }, { status: 400 });
    }
    if (type !== 'auth') {
      return NextResponse.json({ error: 'Unsupported confirmation type' }, { status: 400 });
    }

    const { data: booking, error } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking.paguelofacil_token || token !== booking.paguelofacil_token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const currentCount = booking.auth_count || 0;
    if (currentCount >= booking.bike_quantity) {
      // Idempotent — the browser can retry/refresh this page.
      return NextResponse.json({ success: true });
    }

    const newAuthCount = currentCount + 1;
    const allAuthsDone = newAuthCount >= booking.bike_quantity;

    await supabase
      .from('bookings')
      .update({
        auth_count: newAuthCount,
        auth_status: allAuthsDone ? 'authorized' : 'pending',
        auth_transaction_id: codOper || booking.auth_transaction_id,
        auth_paid_at: allAuthsDone ? new Date().toISOString() : booking.auth_paid_at
      })
      .eq('id', bookingId);

    const emailHtml = depositConfirmationEmailHTML({
      firstName: booking.first_name,
      index: currentCount,
      bikeQuantity: booking.bike_quantity,
      allDone: allAuthsDone
    });

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [booking.email],
        subject: '🔒 Depósito de garantía autorizado — XOPA Moto Rental',
        html: emailHtml
      });
    } catch (e) {
      console.error('Deposit confirmation email failed', e);
    }

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [siteConfig.adminNotificationEmail],
        subject: `🔒 Depósito autorizado — ${booking.first_name} ${booking.last_name} (${newAuthCount}/${booking.bike_quantity})`,
        html: `<p>Booking ${bookingId}: deposit ${newAuthCount}/${booking.bike_quantity} authorized. Transaction: ${codOper || 'n/a'}. Amount: $${totalPaid || DEPOSIT_PER_BIKE}.</p>`
      });
    } catch (e) {
      console.error('Admin deposit notification failed', e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Deposit confirm error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
