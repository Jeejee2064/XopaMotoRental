'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import { siteConfig } from '@/lib/site-config';
import { trackFunnelStep } from '@/lib/analytics/track';

// The PagueloFacil RETURN_URL target for the deposit AUTH flow — confirms
// client-side off the redirect's query params (Estado/Oper/TotalPagado),
// same pattern Overland uses, since the account webhook can't distinguish
// AUTH callbacks (see app/api/pay/confirm/route.js for why).
function AuthSuccessContent() {
  const t = useTranslations('AuthSuccessPage');
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const estado = searchParams.get('Estado');
  const codOper = searchParams.get('Oper');
  const totalPaid = searchParams.get('TotalPagado');
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!bookingId || !token) {
      setStatus('timeout');
      return;
    }

    let cancelled = false;
    const confirm = async () => {
      try {
        if (estado === 'Aprobada') {
          const res = await fetch('/api/pay/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, type: 'auth', codOper, totalPaid, token })
          });
          const data = await res.json();
          if (!cancelled && data.success) {
            setStatus('success');
            trackFunnelStep('deposit_auth_completed', { metadata: { bookingId } });
            return;
          }
        }
        if (!cancelled) setStatus('timeout');
      } catch {
        if (!cancelled) setStatus('timeout');
      }
    };

    confirm();
    return () => {
      cancelled = true;
    };
  }, [bookingId, estado, codOper, totalPaid, token]);

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />
      <section className="pt-40 pb-24 px-4">
        <div className="max-w-lg mx-auto text-center">
          {status === 'loading' && (
            <div className="py-16">
              <Loader2 size={40} className="text-jaune animate-spin mx-auto mb-4" />
              <p className="text-gris">{t('loading')}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8">
              <CheckCircle2 size={56} className="text-jaune mx-auto mb-4" />
              <h1 className="text-3xl font-heading font-black text-white mb-3">{t('successTitle')}</h1>
              <p className="text-gris mb-10">{t('successSubtitle')}</p>
              <ButtonPrimary href="/" text={t('backHome')} />
            </div>
          )}

          {status === 'timeout' && (
            <div className="py-8">
              <Clock size={56} className="text-cyan mx-auto mb-4" />
              <h1 className="text-3xl font-heading font-black text-white mb-3">{t('timeoutTitle')}</h1>
              <p className="text-gris mb-10">{t('timeoutSubtitle')}</p>
              <ButtonPrimary href={siteConfig.whatsappLink} text={t('whatsappCta')} external />
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={null}>
      <AuthSuccessContent />
    </Suspense>
  );
}
