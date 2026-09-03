import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import { siteConfig } from '@/lib/site-config';
import { calculateBookingTotal } from '@/lib/pricing';

// Xopa starts with a single model/location, so unlike Overland's route there's
// no model/location validation branching — just the one combo. Also: Xopa
// charges the FULL rental total online (no 50/50 down-payment split like
// Overland) — a better fit for its much lower ticket size. See plan notes.
const MODEL_LABEL = 'SPI RX250';

export async function POST(request) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      startDate,
      endDate,
      bikeQuantity,
      calculatedDays,
      locale = 'es',
      specialRequests,
      hearAboutUs,
      additionalRiders = []
    } = body;

    if (!firstName || !lastName || !email || !startDate || !endDate || !bikeQuantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const qty = parseInt(bikeQuantity, 10);
    const days = parseInt(calculatedDays, 10);
    if (!qty || qty < 1 || !days || days < 1) {
      return NextResponse.json({ error: 'Invalid quantity or dates' }, { status: 400 });
    }

    // Hard server-side capacity gate before any booking row or payment link exists.
    const { data: availableBikes, error: availabilityError } = await supabase.rpc(
      'check_bikes_available_by_model',
      {
        p_start_date: startDate,
        p_end_date: endDate,
        p_model: siteConfig.fleet.model,
        p_location: siteConfig.fleet.location
      }
    );
    if (availabilityError) {
      console.error('Availability check error:', availabilityError);
      return NextResponse.json({ error: 'Failed to verify availability' }, { status: 500 });
    }
    if ((availableBikes ?? 0) < qty) {
      return NextResponse.json(
        { error: `Only ${availableBikes ?? 0} motorcycle(s) available for the selected dates.` },
        { status: 400 }
      );
    }

    const { total } = calculateBookingTotal({ days, bikeQuantity: qty });
    // Placeholder refundable deposit, collected in person (not processed
    // online — Xopa has no card-hold/AUTH integration yet, unlike Overland's
    // $1000-per-bike PagueloFacil AUTH hold).
    const depositPerBike = 150;
    const totalDeposit = depositPerBike * qty;

    const uniqueToken = crypto.randomBytes(16).toString('hex');

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || '',
          country: country || '',
          start_date: startDate,
          end_date: endDate,
          bike_quantity: qty,
          motorcycle_model: siteConfig.fleet.model,
          pickup_location: siteConfig.fleet.location,
          total_price: total,
          down_payment: total, // full amount — see module comment
          deposit: totalDeposit,
          status: 'pending',
          payment_status: 'pending',
          paid: false,
          paguelofacil_token: uniqueToken,
          pending_verification: true,
          webhook_received: false,
          special_requests: specialRequests || null,
          hear_about_us: hearAboutUs || null
        }
      ])
      .select()
      .single();

    if (bookingError) {
      console.error('Database error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    if (additionalRiders.length > 0) {
      await supabase.from('booking_riders').insert(
        additionalRiders.map((r, i) => ({
          booking_id: booking.id,
          rider_index: i + 2,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email || null,
          phone: r.phone || null
        }))
      );
    }

    const localePrefix = locale && locale !== 'es' ? `/${locale}` : '';
    const returnUrlPlain = `${process.env.NEXT_PUBLIC_BASE_URL}${localePrefix}/booking/success?booking_id=${booking.id}`;
    const returnUrlHex = Buffer.from(returnUrlPlain).toString('hex');

    const customFields = [
      { id: 'bookingId', nameOrLabel: 'Booking ID', value: booking.id },
      { id: 'token', nameOrLabel: 'Security Token', value: uniqueToken },
      { id: 'paymentType', nameOrLabel: 'Payment Type', value: 'FULL' }
    ];
    const customFieldsHex = Buffer.from(JSON.stringify(customFields)).toString('hex');

    const pagueloFacilData = {
      CCLW: process.env.PAGUELOFACIL_CCLW,
      CMTN: total.toFixed(2),
      CDSC: `XOPA Moto Rental - ${firstName} ${lastName} - ${qty} x ${MODEL_LABEL} for ${days} days`,
      RETURN_URL: returnUrlHex,
      PF_CF: customFieldsHex,
      PARM_1: booking.id,
      PARM_2: uniqueToken,
      PARM_3: qty.toString(),
      PARM_4: startDate,
      PARM_5: endDate,
      PARM_6: email,
      EXPIRES_IN: 3600
    };

    // Deliberately NOT keyed off NODE_ENV: `next build` sets NODE_ENV=production
    // on every Vercel deploy (preview included), so that check can't tell a real
    // deploy from a demo-CCLW test deploy. PAGUELOFACIL_SANDBOX is the explicit,
    // single source of truth — defaults to sandbox so forgetting to set it can't
    // silently start charging real cards. Set PAGUELOFACIL_SANDBOX=false once the
    // live CCLW replaces the demo one in production.
    const linkDeamonUrl =
      process.env.PAGUELOFACIL_SANDBOX === 'false'
        ? 'https://secure.paguelofacil.com/LinkDeamon.cfm'
        : 'https://sandbox.paguelofacil.com/LinkDeamon.cfm';

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
      console.error('PagueloFacil error:', responseData);
      await supabase.from('bookings').delete().eq('id', booking.id);
      return NextResponse.json(
        { error: responseData.message || 'Failed to create payment link', details: responseData },
        { status: 400 }
      );
    }

    await supabase.from('bookings').update({ paguelofacil_cclw: responseData.data.code }).eq('id', booking.id);

    return NextResponse.json({
      url: responseData.data.url,
      bookingId: booking.id,
      paymentCode: responseData.data.code
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 });
  }
}
