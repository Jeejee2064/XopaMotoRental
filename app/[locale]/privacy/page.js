import { useTranslations } from 'next-intl';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export async function generateMetadata() {
  return { robots: { index: false, follow: true } };
}

export default function PrivacyPage() {
  const t = useTranslations('PrivacyPage');

  const sections = [1, 2, 3, 4].map((n) => ({
    title: t(`section${n}Title`),
    body: t(`section${n}Body`)
  }));

  return (
    <div className="min-h-screen bg-noir">
      <Navigation />
      <section className="pt-32 pb-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-jaune mb-2">{t('title')}</h1>
          <p className="text-gris/60 text-sm mb-10">{t('updated')}</p>
          <p className="text-gris leading-relaxed mb-12">{t('intro')}</p>

          <div className="space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-xl font-heading font-bold text-white mb-2">{s.title}</h2>
                <p className="text-gris leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
