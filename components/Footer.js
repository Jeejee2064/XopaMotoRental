import { Clock, Phone, Mail, MapPin, Facebook, Instagram, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '../navigation';
import { siteConfig, crossLinks } from '@/lib/site-config';

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: siteConfig.social.facebook, color: 'hover:text-cyan' },
  { name: 'Instagram', icon: Instagram, href: siteConfig.social.instagram, color: 'hover:text-jaune' }
];

const Footer = () => {
  const t = useTranslations('Footer');

  return (
    <footer className="bg-noir border-t-2 border-jaune">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
          {/* Company info */}
          <div className="lg:col-span-2 text-center md:text-left">
            <div className="mb-8 flex justify-center md:justify-start">
              <Image src="/logo.png" alt={t('companyName')} width={280} height={120} className="h-16 w-auto object-contain" />
            </div>
            <p className="text-gris text-lg mb-8 leading-relaxed max-w-md mx-auto md:mx-0">{t('description')}</p>

            <div className="space-y-4">
              <h4 className="text-jaune font-heading font-bold uppercase tracking-wide">{t('followUs')}</h4>
              <div className="flex justify-center md:justify-start gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-11 h-11 border border-gris/30 rounded-full flex items-center justify-center text-gris transition-colors duration-200 ${social.color}`}
                  >
                    <social.icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="text-center md:text-left">
            <h4 className="text-jaune font-heading font-bold uppercase tracking-wide mb-6 flex items-center justify-center md:justify-start gap-2">
              <Clock size={18} />
              {t('openingHours')}
            </h4>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-white font-bold">{t('weekdays')}</span>
                <span className="text-gris">{t('weekdayHours')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold">{t('weekend')}</span>
                <span className="text-gris">{t('weekendHours')}</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h4 className="text-jaune font-heading font-bold uppercase tracking-wide mb-6">{t('getInTouch')}</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 justify-center md:justify-start">
                <MapPin size={16} className="text-jaune mt-1 flex-shrink-0" />
                <p className="text-gris leading-relaxed text-left">{siteConfig.address}</p>
              </div>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 text-gris hover:text-jaune transition-colors duration-200 justify-center md:justify-start"
              >
                <Mail size={16} className="text-jaune flex-shrink-0" />
                <span>{siteConfig.email}</span>
              </a>
              <a
                href={siteConfig.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gris hover:text-jaune transition-colors duration-200 justify-center md:justify-start"
              >
                <Phone size={16} className="text-jaune flex-shrink-0" />
                <span>{siteConfig.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Cross-links to sibling projects */}
        <div className="mt-16 pt-10 border-t border-gris/20">
          <h4 className="text-gris/70 font-heading font-bold uppercase tracking-wide text-sm mb-6 text-center md:text-left">
            {t('crossLinksTitle')}
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            {crossLinks.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 border border-gris/20 px-5 py-4 hover:border-cyan transition-colors duration-200 group"
              >
                <div>
                  <p className="text-white font-heading font-bold uppercase tracking-wide">{t(`${item.key}Name`)}</p>
                  <p className="text-gris text-sm">{t(`${item.key}Desc`)}</p>
                </div>
                <ArrowUpRight size={20} className="text-gris group-hover:text-cyan transition-colors duration-200 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gris/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-gris text-sm">
              © 2026 {siteConfig.companyName}. {t('allRightsReserved')}
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gris hover:text-jaune transition-colors duration-200">
                {t('privacy')}
              </Link>
              <Link href="/terms" className="text-gris hover:text-jaune transition-colors duration-200">
                {t('terms')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
