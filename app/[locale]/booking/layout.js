import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'BookingMetadata' });
  return {
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords')
  };
}

export default function BookingLayout({ children }) {
  return children;
}
