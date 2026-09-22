import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HowItWorksMetadata' });
  return pageMetadata({
    locale,
    path: '/how-it-works',
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords')
  });
}

export default function HowItWorksLayout({ children }) {
  return children;
}
