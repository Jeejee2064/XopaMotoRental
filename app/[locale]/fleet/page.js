import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';
import { Reveal, Stagger, StaggerItem } from '@/components/motion';

// Single model for now — structured as a list so adding the next bike later
// (bigger cc, scooter, whatever comes next) is a matter of appending an entry,
// not restructuring the page.
function getFleet(t) {
  return [
    {
      brand: t('modelBrand'),
      name: t('modelName'),
      tagline: t('modelTagline'),
      desc: t('modelDesc'),
      specs: [
        { label: t('specDisplacement'), value: t('specDisplacementValue') },
        { label: t('specCategory'), value: t('specCategoryValue') },
        { label: t('specUse'), value: t('specUseValue') },
        { label: t('specComfort'), value: t('specComfortValue') }
      ]
    }
  ];
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

      {fleet.map((bike) => (
        <section key={bike.name} className="py-20 px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-start">
            <Stagger className="grid grid-cols-2 gap-3">
              <StaggerItem className="col-span-2 aspect-[4/3] relative overflow-hidden">
                <Image src="/hero.jpeg" alt={`${bike.brand} ${bike.name}`} fill className="object-cover" priority />
              </StaggerItem>
              <StaggerItem className="aspect-square relative overflow-hidden">
                <Image src="/RX250.jpeg" alt={`${bike.brand} ${bike.name}`} fill className="object-cover" />
              </StaggerItem>
              <StaggerItem className="aspect-square relative overflow-hidden">
                <Image src="/riding.jpeg" alt={`${bike.brand} ${bike.name} en circulation`} fill className="object-cover" />
              </StaggerItem>
            </Stagger>

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

              <ButtonPrimary href="/booking" text={t('cta')} />
            </Reveal>
          </div>
        </section>
      ))}

      <Footer />
    </div>
  );
}
