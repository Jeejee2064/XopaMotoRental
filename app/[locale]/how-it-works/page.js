import { useTranslations } from 'next-intl';
import { CircleCheck } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';

export default function HowItWorksPage() {
  const t = useTranslations('HowItWorksPage');

  const steps = [
    { title: t('step1Title'), desc: t('step1Desc') },
    { title: t('step2Title'), desc: t('step2Desc') },
    { title: t('step3Title'), desc: t('step3Desc') },
    { title: t('step4Title'), desc: t('step4Desc') }
  ];

  const requirements = [t('requirement1'), t('requirement2'), t('requirement3'), t('requirement4')];

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
        <Stagger className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6 mb-20">
          {steps.map((s, i) => (
            <StaggerItem key={i} className="border-t-4 border-cyan pt-6">
              <h2 className="text-2xl font-heading font-bold text-white mb-2">{s.title}</h2>
              <p className="text-gris leading-relaxed">{s.desc}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="text-cyan font-heading font-bold uppercase tracking-wide mb-6">{t('requirementsTitle')}</h2>
          </Reveal>
          <Stagger as="ul" className="flex flex-col items-center gap-3 mb-12">
            {requirements.map((item) => (
              <StaggerItem key={item} as="li" className="flex items-center gap-2 text-gris">
                <CircleCheck size={18} className="text-jaune flex-shrink-0" />
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
