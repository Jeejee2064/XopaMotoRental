import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Bike, MapPin, MessageCircle, ArrowUpRight } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import ButtonSecondary from '@/components/ButtonSecondary';
import { crossLinks } from '@/lib/site-config';
import { GridPattern } from '@/components/backgrounds';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';

export default function HomePage() {
  const t = useTranslations('HomePage');
  const tFooter = useTranslations('Footer');

  const features = [
    { icon: ShieldCheck, text: t('feature1') },
    { icon: Bike, text: t('feature2') },
    { icon: MapPin, text: t('feature3') },
    { icon: MessageCircle, text: t('feature4') }
  ];

  const steps = [
    { title: t('step1Title'), desc: t('step1Desc') },
    { title: t('step2Title'), desc: t('step2Desc') },
    { title: t('step3Title'), desc: t('step3Desc') }
  ];

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-4 overflow-hidden border-b-2 border-jaune">
        <Image
          src="/riding.jpeg"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-noir/80" />
        <div className="absolute inset-0 text-gris">
          <GridPattern className="w-full h-full" />
        </div>
        <Stagger className="relative max-w-5xl mx-auto text-center">
          <StaggerItem as="img" src="/logo.png" alt="XOPA Moto Rental" className="w-full max-w-md mx-auto h-auto mb-10" />
          <StaggerItem as="p" className="text-2xl md:text-3xl text-jaune font-heading font-bold uppercase mb-4">
            {t('hero')}
          </StaggerItem>
          <StaggerItem as="p" className="text-lg md:text-xl text-gris max-w-2xl mx-auto mb-10">
            {t('heroSubtitle')}
          </StaggerItem>
          <StaggerItem className="flex flex-col sm:flex-row gap-5 justify-center">
            <ButtonPrimary href="/booking" text={t('bookTrip')} />
            <ButtonSecondary href="/fleet" text={t('viewFleet')} theme="dark" />
          </StaggerItem>
        </Stagger>
      </section>

      {/* Intro */}
      <section className="py-20 px-4 bg-noir">
        <div className="max-w-5xl mx-auto text-center">
          <Reveal>
            <h2 className="text-4xl md:text-5xl font-heading font-black text-jaune mb-6">{t('introTitle')}</h2>
            <p className="text-lg text-gris leading-relaxed max-w-3xl mx-auto mb-14">{t('introDesc')}</p>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <StaggerItem
                key={i}
                className="border border-gris/20 p-6 flex flex-col items-center gap-3 hover:border-cyan transition-colors duration-200"
              >
                <f.icon size={28} className="text-cyan" />
                <p className="text-white font-medium">{f.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Fleet teaser */}
      <section className="py-20 px-4 bg-white text-noir">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="text-cyan font-heading font-bold uppercase tracking-wide mb-2">{t('fleetTitle')}</p>
            <h2 className="text-5xl md:text-6xl font-heading font-black mb-6">{t('fleetSubtitle')}</h2>
            <p className="text-lg text-noir/80 leading-relaxed mb-8">{t('fleetDesc')}</p>
            <ButtonSecondary href="/fleet" text={t('fleetCta')} theme="light" />
          </Reveal>
          <Reveal delay={0.15} className="aspect-square relative overflow-hidden">
            <Image src="/RX250_2.jpeg" alt="SPI RX250 — XOPA Moto Rental" fill className="object-cover" />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-noir">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-jaune mb-4">{t('howTitle')}</h2>
            <p className="text-lg text-gris">{t('howDesc')}</p>
          </Reveal>
          <Stagger className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <StaggerItem key={i} className="border-t-4 border-cyan pt-6">
                <h3 className="text-2xl font-heading font-bold text-white mb-2">{s.title}</h3>
                <p className="text-gris leading-relaxed">{s.desc}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-20 px-4 bg-cyan text-noir text-center">
        <Reveal className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-heading font-black mb-4">{t('pricingTeaserTitle')}</h2>
          <p className="text-lg mb-8 opacity-90">{t('pricingTeaserDesc')}</p>
          <ButtonSecondary href="/pricing" text={t('ctaPricing')} theme="dark" />
        </Reveal>
      </section>

      {/* Cross-links teaser */}
      <section className="py-16 px-4 bg-noir border-y border-gris/20">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-2xl font-heading font-bold text-white mb-2">{t('crossTitle')}</h2>
            <p className="text-gris mb-8">{t('crossDesc')}</p>
          </Reveal>
          <Stagger className="grid sm:grid-cols-2 gap-4 text-left">
            {crossLinks.map((item) => (
              <StaggerItem
                key={item.key}
                as="a"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 border border-gris/20 px-5 py-4 hover:border-cyan transition-colors duration-200 group"
              >
                <div>
                  <p className="text-white font-heading font-bold uppercase tracking-wide">{tFooter(`${item.key}Name`)}</p>
                  <p className="text-gris text-sm">{tFooter(`${item.key}Desc`)}</p>
                </div>
                <ArrowUpRight size={20} className="text-gris group-hover:text-cyan transition-colors duration-200 flex-shrink-0" />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-24 px-4 bg-noir text-center">
        <Reveal className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-heading font-black text-jaune mb-4">{t('contactTitle')}</h2>
          <p className="text-lg text-gris mb-10">{t('contactDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <ButtonPrimary href="/booking" text={t('bookTrip')} />
            <ButtonSecondary href="/contact" text={t('contactCta')} theme="dark" />
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
