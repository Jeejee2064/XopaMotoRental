import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';
import { siteConfig } from '@/lib/site-config';

// Driven by siteConfig.fleet.models — each model has a matching
// FleetPage.<messageKey> entry in messages/*.json.
function getFleet(t) {
  return siteConfig.fleet.models.map((model) => {
    const k = model.messageKey;
    return {
      id: model.id,
      images: model.images,
      imageCredit: model.imageCredit,
      brand: t(`${k}.brand`),
      name: t(`${k}.name`),
      tagline: t(`${k}.tagline`),
      desc: t(`${k}.desc`),
      cta: t(`${k}.cta`),
      specs: [
        { label: t('specDisplacement'), value: t(`${k}.specDisplacementValue`) },
        { label: t('specCategory'), value: t(`${k}.specCategoryValue`) },
        { label: t('specUse'), value: t(`${k}.specUseValue`) },
        { label: t('specComfort'), value: t(`${k}.specComfortValue`) }
      ]
    };
  });
}

export default function FleetPage() {
  const t = useTranslations('FleetPage');
  const fleet = getFleet(t);

  const included = [t('included1'), t('included2'), t('included3'), t('included4')];

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />

      <section className="pt-32 pb-16 px-4 border-b-2 border-jaune">
        <Reveal className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-heading font-black text-jaune mb-4">{t('title')}</h1>
          <p className="text-lg text-gris max-w-2xl mx-auto">{t('intro')}</p>
        </Reveal>
      </section>

      {fleet.map((bike, index) => (
        <section key={bike.id} id={bike.id.toLowerCase()} className={`py-20 px-4 ${index > 0 ? 'border-t border-gris/20' : ''}`}>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <Stagger className="grid grid-cols-2 gap-3">
                {bike.images.map((src, i) => (
                  <StaggerItem
                    key={src}
                    className={`relative overflow-hidden ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
                  >
                    <Image
                      src={src}
                      alt={`${bike.brand} ${bike.name}`}
                      fill
                      className="object-cover"
                      priority={index === 0 && i === 0}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  </StaggerItem>
                ))}
              </Stagger>
              {bike.imageCredit && (
                <p className="text-gris/50 text-xs mt-2">
                  {t('photoCredit')} {bike.imageCredit}
                </p>
              )}
            </div>

            <Reveal delay={0.15}>
              <p className="text-cyan font-heading font-bold uppercase tracking-wide mb-1">{bike.brand}</p>
              <h2 className="text-5xl font-heading font-black text-white mb-2">{bike.name}</h2>
              <p className="text-jaune font-heading font-bold uppercase mb-6">{bike.tagline}</p>
              <p className="text-gris leading-relaxed mb-8">{bike.desc}</p>

              <h3 className="text-cyan font-heading font-bold uppercase tracking-wide mb-4">{t('specsTitle')}</h3>
              <dl className="grid grid-cols-2 gap-y-4 mb-10 border-t border-gris/20 pt-6">
                {bike.specs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="text-gris/60 text-sm uppercase tracking-wide">{spec.label}</dt>
                    <dd className="text-white font-bold">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="text-cyan font-heading font-bold uppercase tracking-wide mb-4">{t('includedTitle')}</h3>
              <ul className="space-y-2 mb-10">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gris">
                    <Check size={18} className="text-jaune flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <ButtonPrimary href="/booking" text={bike.cta} />
            </Reveal>
          </div>
        </section>
      ))}

      <Footer />
    </div>
  );
}
