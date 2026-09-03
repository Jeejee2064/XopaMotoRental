'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import ButtonSecondary from '@/components/ButtonSecondary';
import { siteConfig } from '@/lib/site-config';

export default function BookingSuccessPage() {
  const t = useTranslations('SuccessPage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      setError(true);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    // The webhook that finalizes the booking is async (PagueloFacil calls it
    // server-to-server, separately from this return-URL redirect), so poll a
    // few times in case this page loads a moment before it's landed.
    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/bookings/${bookingId}/confirmation`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        setBooking(data.booking);
        if (data.booking.status === 'pending' && attempts < 6) {
          setTimeout(poll, 2000);
        } else {
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-PA' : locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const status = booking?.status === 'failed' ? 'failed' : booking?.payment_status === 'paid' ? 'paid' : 'pending';

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />
      <section className="pt-40 pb-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {loading && (
            <div className="py-16">
              <Loader2 size={40} className="text-jaune animate-spin mx-auto mb-4" />
              <p className="text-gris">{t('loading')}</p>
            </div>
          )}

          {!loading && (error || !booking) && (
            <div className="py-16">
              <XCircle size={56} className="text-cyan mx-auto mb-4" />
              <h1 className="text-3xl font-heading font-black text-white mb-6">{t('notFound')}</h1>
              <ButtonPrimary href="/" text={t('backHome')} />
            </div>
          )}

          {!loading && !error && booking && (
            <div className="py-8">
              {status === 'paid' && <CheckCircle2 size={56} className="text-jaune mx-auto mb-4" />}
              {status === 'pending' && <Clock size={56} className="text-cyan mx-auto mb-4" />}
              {status === 'failed' && <XCircle size={56} className="text-cyan mx-auto mb-4" />}

              <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-3">
                {status === 'paid' ? t('titlePaid') : status === 'failed' ? t('titleFailed') : t('titlePending')}
              </h1>
              <p className="text-gris mb-10">
                {status === 'paid' ? t('subtitlePaid') : status === 'failed' ? t('subtitleFailed') : t('subtitlePending')}
              </p>

              <div className="border border-gris/20 p-6 text-left mb-10">
                <div className="flex justify-between py-2 border-b border-gris/10">
                  <span className="text-gris text-sm">{t('refLabel')}</span>
                  <span className="text-white font-mono text-sm">{booking.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gris/10">
                  <span className="text-gris text-sm">{t('motoLabel')}</span>
                  <span className="text-white text-sm">
                    {booking.bike_quantity} × SPI {booking.motorcycle_model}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gris/10">
                  <span className="text-gris text-sm">{t('datesLabel')}</span>
                  <span className="text-white text-sm">
                    {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gris text-sm">{t('locationLabel')}</span>
                  <span className="text-white text-sm">{booking.pickup_location}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {status === 'failed' ? (
                  <ButtonPrimary href="/booking" text={t('retryCta')} />
                ) : (
                  <ButtonPrimary href={siteConfig.whatsappLink} text={t('whatsappCta')} external />
                )}
                <ButtonSecondary href="/" text={t('backHome')} theme="dark" />
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
