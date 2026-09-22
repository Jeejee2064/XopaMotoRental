import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ContactMetadata' });
  return pageMetadata({
    locale,
    path: '/contact',
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords')
  });
}

export default function ContactLayout({ children }) {
  return children;
}
