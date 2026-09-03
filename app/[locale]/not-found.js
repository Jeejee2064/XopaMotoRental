import { useTranslations } from 'next-intl';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ButtonPrimary from '@/components/ButtonPrimary';

export default function NotFound() {
  const t = useTranslations('NotFound');

  return (
    <div className="min-h-screen bg-noir flex flex-col">
      <Navigation />
      <section className="flex-1 flex items-center justify-center px-4 py-32 text-center">
        <div>
          <p className="text-8xl font-heading font-black text-cyan mb-4">404</p>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-jaune mb-4">{t('title')}</h1>
          <p className="text-gris mb-10 max-w-md mx-auto">{t('description')}</p>
          <ButtonPrimary href="/" text={t('backHome')} />
        </div>
      </section>
      <Footer />
    </div>
  );
}
