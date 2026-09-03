import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';

export default function PricingPage() {
  const t = useTranslations('PricingPage');

  const plans = [
    { label: t('dayLabel'), price: t('dayPrice'), note: t('dayNote') },
    { label: t('weekLabel'), price: t('weekPrice'), note: t('weekNote'), highlight: true },
    { label: t('monthLabel'), price: t('monthPrice'), note: t('monthNote') }
  ];

  const included = [t('included1'), t('included2'), t('included3'), t('included4')];

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />

      <section className="pt-32 pb-16 px-4 border-b-2 border-jaune">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-black text-jaune mb-4">{t('title')}</h1>
          <p className="text-lg text-gris">{t('intro')}</p>
        </Reveal>
      </section>

      <section className="py-20 px-4">
        <Stagger className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <StaggerItem
              key={plan.label}
              className={`p-8 flex flex-col items-center text-center border-2 ${
                plan.highlight ? 'bg-cyan border-cyan text-noir' : 'border-gris/20 text-white'
              }`}
            >
              <p className="font-heading font-bold uppercase tracking-wide mb-4 opacity-90">{plan.label}</p>
              <p className="text-5xl font-heading font-black mb-2">{plan.price}</p>
              <p className={plan.highlight ? 'opacity-90' : 'text-gris'}>{plan.note}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="max-w-5xl mx-auto text-center text-gris/60 text-sm mb-16">{t('disclaimer')}</p>

        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="text-cyan font-heading font-bold uppercase tracking-wide mb-6">{t('includedTitle')}</h2>
          </Reveal>
          <Stagger as="ul" className="flex flex-col sm:flex-row flex-wrap justify-center gap-x-8 gap-y-3 mb-12">
            {included.map((item) => (
              <StaggerItem key={item} as="li" className="flex items-center gap-2 text-gris">
                <Check size={18} className="text-jaune flex-shrink-0" />
                {item}
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal>
            <ButtonPrimary href="/booking" text={t('cta')} />
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
