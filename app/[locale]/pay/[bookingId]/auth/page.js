import { getTranslations } from 'next-intl/server';
import { CheckCircle2, XCircle } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';
import AuthPayButton from './AuthPayButton';

const DEPOSIT_PER_BIKE = 375;

// Public deposit-authorization page a customer lands on from the admin-sent
// link — mirrors Overland's app/[locale]/pay/[bookingId]/auth/page.js. A
// server component (not the client-fetch pattern the rest of this app uses)
// so the booking lookup stays server-side and no new public
// booking-by-id API route needs to exist just for this.
export default async function AuthPage({ params, searchParams }) {
  const { locale, bookingId } = await params;
  const sp = await searchParams;
  const index = parseInt(sp?.index || '0', 10);
  const t = await getTranslations({ locale, namespace: 'AuthPage' });

  const supabase = getSupabaseAdmin();
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();

  if (!booking) {
    return (
      <div className="min-h-screen bg-noir">
        <Navigation />
        <section className="pt-40 pb-24 px-4 text-center">
          <XCircle size={56} className="text-cyan mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-black text-white">{t('notFound')}</h1>
        </section>
        <Footer />
      </div>
    );
  }

  const alreadyAuthorized = (booking.auth_count || 0) > index;
  const depositLabel = booking.bike_quantity > 1 ? t('depositLabelIndexed', { index: index + 1, total: booking.bike_quantity }) : t('depositLabel');

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />
      <section className="pt-40 pb-24 px-4">
        <div className="max-w-lg mx-auto">
          {alreadyAuthorized ? (
            <div className="text-center py-8">
              <CheckCircle2 size={56} className="text-jaune mx-auto mb-4" />
              <h1 className="text-3xl font-heading font-black text-white mb-3">{t('alreadyAuthorizedTitle')}</h1>
              <p className="text-gris">{t('alreadyAuthorizedSubtitle')}</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-3 text-center">{t('title')}</h1>
              <p className="text-gris mb-10 text-center">{t('subtitle')}</p>

              <div className="border border-gris/20 p-6 mb-8">
                <div className="flex justify-between py-2 border-b border-gris/10">
                  <span className="text-gris text-sm">{t('customerLabel')}</span>
                  <span className="text-white text-sm">{booking.first_name} {booking.last_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gris/10">
                  <span className="text-gris text-sm">{t('itemLabel')}</span>
                  <span className="text-white text-sm">{depositLabel}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gris text-sm">{t('amountLabel')}</span>
                  <span className="text-jaune font-heading font-bold text-lg">${DEPOSIT_PER_BIKE.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-gris/70 text-xs mb-8 text-center">{t('disclaimer')}</p>

              <AuthPayButton bookingId={bookingId} index={index} locale={locale} label={t('payCta')} />
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
