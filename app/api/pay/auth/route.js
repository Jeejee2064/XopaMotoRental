import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

// Card-hold (AUTH, not a capture) for the refundable security deposit —
// mirrors Overland's app/api/pay/auth/route.js, adapted for Xopa's
// $375/bike deposit (vs. Overland's $1000). Called from the CUSTOMER's
// browser (AuthPayButton on /pay/[bookingId]/auth), not the admin panel —
// the admin only sends the stable /pay/[bookingId]/auth link (see
// app/api/admin/bookings/[id]/send-deposit-link/route.js), never a
// PagueloFacil URL directly, since that one-time link expires in
// EXPIRES_IN=3600 seconds and must be generated fresh when the customer
// actually clicks "pay", not whenever the admin happens to send it.
const DEPOSIT_PER_BIKE = 375;

export async function POST(request) {
  const supabase = getSupabaseAdmin();

  try {
    const { bookingId, index = 0, locale = 'es' } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    const { data: booking, error } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only blocks this specific bike's deposit — a booking with several
    // bikes sends one AUTH link per index, independently.
    if ((booking.auth_count || 0) > index) {
      return NextResponse.json({ error: 'Deposit already authorized for this bike' }, { status: 400 });
    }

    // Same token the main payment flow mints — reused here (and minted lazily
    // for admin-created bookings that never went through that route) so the
    // customer-facing return trip in /api/pay/confirm can verify it's really
    // this booking's payment, same anti-tamper guard as create-paguelofacil-payment.
    let confirmToken = booking.paguelofacil_token;
    if (!confirmToken) {
      confirmToken = crypto.randomBytes(16).toString('hex');
      await supabase.from('bookings').update({ paguelofacil_token: confirmToken }).eq('id', bookingId);
    }

    const localePrefix = locale && locale !== 'es' ? `/${locale}` : '';
    const returnUrlPlain = `${process.env.NEXT_PUBLIC_BASE_URL}${localePrefix}/pay/auth-success?bookingId=${bookingId}&index=${index}&token=${confirmToken}`;
    const returnUrlHex = Buffer.from(returnUrlPlain).toString('hex');

    const customFields = [
      { id: 'bookingId', nameOrLabel: 'Booking ID', value: bookingId },
      { id: 'paymentType', nameOrLabel: 'Payment Type', value: 'AUTH' },
      { id: 'authIndex', nameOrLabel: 'Auth Index', value: String(index) }
    ];
    const customFieldsHex = Buffer.from(JSON.stringify(customFields)).toString('hex');

    const pagueloFacilData = {
      CCLW: process.env.PAGUELOFACIL_CCLW,
      TX_TYPE: 'AUTH',
      CMTN: DEPOSIT_PER_BIKE.toFixed(2),
      CDSC: `XOPA Security Deposit${booking.bike_quantity > 1 ? ` #${index + 1}` : ''} - ${booking.first_name} ${booking.last_name}`,
      RETURN_URL: returnUrlHex,
      PF_CF: customFieldsHex,
      PARM_1: bookingId,
      EXPIRES_IN: 3600
    };

    // /AUTH suffix is required so PagueloFacil generates a hold instead of
    // capturing the funds immediately, even with TX_TYPE=AUTH in the body —
    // same sandbox/prod selection as create-paguelofacil-payment/route.js
    // (PAGUELOFACIL_SANDBOX is the explicit source of truth, not NODE_ENV).
    const linkDeamonUrl =
      process.env.PAGUELOFACIL_SANDBOX === 'false'
        ? 'https://secure.paguelofacil.com/LinkDeamon.cfm/AUTH'
        : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm/AUTH';

    const formBody = Object.keys(pagueloFacilData)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(pagueloFacilData[key])}`)
      .join('&');

    const response = await fetch(linkDeamonUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: '*/*' },
      body: formBody
    });
    const responseData = await response.json();

    if (!responseData.success || !responseData.data?.url) {
      console.error('PagueloFacil AUTH error:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Failed to create AUTH link', details: responseData },
        { status: 400 }
      );
    }

    await supabase
      .from('bookings')
      .update({ auth_status: 'pending', auth_link_sent_at: new Date().toISOString() })
      .eq('id', bookingId);

    return NextResponse.json({ url: responseData.data.url });
  } catch (error) {
    console.error('AUTH link creation error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
