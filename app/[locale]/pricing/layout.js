import { getTranslations } from 'next-intl/server';
import { pageMetadata } from '@/lib/seo';
import { getRentalPriceForDays, getPricingForModel } from '@/lib/pricing';
import { siteConfig } from '@/lib/site-config';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PricingMetadata' });
  return pageMetadata({
    locale,
    path: '/pricing',
    title: t('title'),
    description: t('description'),
    keywords: t.raw('keywords')
  });
}

export default async function PricingLayout({ children, params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'PricingPage' });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const pricingUrl = `${baseUrl}${locale === 'es' ? '' : `/${locale}`}/pricing`;

  // Kept in sync with lib/pricing.js (MODEL_PRICING) rather than re-parsing
  // the "$60"-style display strings in messages/*.json.
  const productSchema = siteConfig.fleet.models.map((model) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${model.label} — XOPA Moto Rental`,
    description: t('intro'),
    brand: { '@type': 'Brand', name: model.brand },
    offers: [
      { days: 1, label: t('dayLabel') },
      { days: 7, label: t('weekLabel') },
      { days: 30, label: t('monthLabel') }
    ].map(({ days, label }) => ({
      '@type': 'Offer',
      name: label,
      price: String(getRentalPriceForDays(days, getPricingForModel(model.id))),
      priceCurrency: 'USD',
      url: pricingUrl,
      availability: 'https://schema.org/InStock'
    }))
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {children}
    </>
  );
}
