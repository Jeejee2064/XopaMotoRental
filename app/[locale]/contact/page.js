import { useTranslations } from 'next-intl';
import { MessageCircle, MapPin, Mail, Phone, Clock, Facebook, Instagram } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import { siteConfig } from '@/lib/site-config';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';

// Booking (with real availability + payment) now lives at /booking — this
// page stays focused on direct contact channels (WhatsApp, phone, email,
// office) rather than duplicating that flow, with a CTA pointing to it.
export default function ContactPage() {
  const t = useTranslations('ContactPage');

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />

      <section className="pt-32 pb-16 px-4 border-b-2 border-jaune">
        <Reveal className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-black text-jaune mb-4">{t('title')}</h1>
          <p className="text-lg text-gris mb-8">{t('intro')}</p>
          <ButtonPrimary href="/booking" text={t('bookCta')} />
        </Reveal>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal
            as="a"
            href={siteConfig.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-6 bg-jaune text-noir p-8 mb-10 hover:bg-cyan hover:text-noir transition-colors duration-200 group"
          >
            <div className="flex items-center gap-5">
              <MessageCircle size={40} strokeWidth={2} />
              <div>
                <p className="font-heading font-bold uppercase tracking-wide text-2xl">{t('whatsappTitle')}</p>
                <p className="opacity-80">{siteConfig.phone}</p>
              </div>
            </div>
            <span className="font-heading font-bold uppercase whitespace-nowrap">{t('whatsappCta')}</span>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 gap-6">
            <StaggerItem className="border border-gris/20 p-6">
              <h2 className="flex items-center gap-2 text-cyan font-heading font-bold uppercase tracking-wide mb-3">
                <MapPin size={18} />
                {t('addressTitle')}
              </h2>
              <p className="text-gris leading-relaxed">{siteConfig.address}</p>
            </StaggerItem>

            <StaggerItem className="border border-gris/20 p-6">
              <h2 className="flex items-center gap-2 text-cyan font-heading font-bold uppercase tracking-wide mb-3">
                <Clock size={18} />
                {t('hoursTitle')}
              </h2>
              <p className="text-white font-bold">{t('weekdays')}</p>
              <p className="text-gris mb-2">{t('weekdayHours')}</p>
              <p className="text-white font-bold">{t('weekend')}</p>
              <p className="text-gris">{t('weekendHours')}</p>
            </StaggerItem>

            <StaggerItem className="border border-gris/20 p-6">
              <h2 className="flex items-center gap-2 text-cyan font-heading font-bold uppercase tracking-wide mb-3">
                <Mail size={18} />
                {t('emailTitle')}
              </h2>
              <a href={`mailto:${siteConfig.email}`} className="text-gris hover:text-jaune transition-colors duration-200">
                {siteConfig.email}
              </a>
            </StaggerItem>

            <StaggerItem className="border border-gris/20 p-6">
              <h2 className="flex items-center gap-2 text-cyan font-heading font-bold uppercase tracking-wide mb-3">
                <Phone size={18} />
                {t('phoneTitle')}
              </h2>
              <a href={`tel:${siteConfig.phoneIntl}`} className="text-gris hover:text-jaune transition-colors duration-200">
                {siteConfig.phone}
              </a>
            </StaggerItem>
          </Stagger>

          <Reveal className="mt-10 text-center">
            <h2 className="text-gris/60 font-heading font-bold uppercase tracking-wide text-sm mb-4">{t('socialTitle')}</h2>
            <div className="flex justify-center gap-4">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 border border-gris/30 rounded-full flex items-center justify-center text-gris hover:text-cyan transition-colors duration-200"
              >
                <Facebook size={18} />
              </a>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 border border-gris/30 rounded-full flex items-center justify-center text-gris hover:text-jaune transition-colors duration-200"
              >
                <Instagram size={18} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
