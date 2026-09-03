import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import WhatsApp from '@/components/Whatsapp';
import { siteConfig } from '@/lib/site-config';

const locales = ['es', 'en', 'fr'];

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const currentUrl = locale === 'es' ? baseUrl : `${baseUrl}/${locale}`;

  return {
    title: {
      template: `%s | ${t('title')}`,
      default: t('title')
    },
    description: t('description'),
    metadataBase: new URL(baseUrl),
    keywords: t.raw('keywords'),
    authors: [{ name: 'XOPA Moto Rental' }],
    creator: 'XOPA Moto Rental',
    publisher: 'XOPA Moto Rental',
    alternates: {
      canonical: currentUrl,
      languages: {
        'es-419': '/',
        'en-US': '/en',
        'fr-FR': '/fr',
        'x-default': '/'
      }
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: currentUrl,
      siteName: 'XOPA Moto Rental',
      locale: getOpenGraphLocale(locale),
      type: 'website',
      images: [
        {
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'XOPA Moto Rental — alquiler de motos en Panama City'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: ['/og-image.jpg']
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    category: 'motorcycle rentals'
  };
}

function getOpenGraphLocale(locale) {
  const localeMap = { es: 'es_PA', en: 'en_US', fr: 'fr_FR' };
  return localeMap[locale] || 'es_PA';
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;

  if (!locales.includes(locale)) notFound();

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'Metadata' });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Same office & phone as Overland Motorcycles (same owners) — see lib/site-config.js.
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}#organization`,
    name: siteConfig.companyName,
    description: 'Alquiler de motos SPI en Panama City por día, semana o mes.',
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 512,
      height: 512
    },
    image: `${baseUrl}/og-image.jpg`,
    telephone: siteConfig.phoneIntl,
    email: siteConfig.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address,
      addressLocality: siteConfig.addressLocality,
      addressRegion: 'Panama',
      addressCountry: siteConfig.addressCountry
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: siteConfig.geo.latitude,
      longitude: siteConfig.geo.longitude
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '18:00'
      }
    ],
    priceRange: '$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card',
    areaServed: {
      '@type': 'City',
      name: 'Panama City'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Motorcycle Rental Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'SPI RX250 Rental',
            description: 'Small-displacement adventure motorcycle rental in Panama City'
          }
        }
      ]
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'Customer Service',
        telephone: siteConfig.phoneIntl,
        email: siteConfig.email,
        availableLanguage: ['Spanish', 'English', 'French'],
        areaServed: 'PA'
      }
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    url: baseUrl,
    name: 'XOPA Moto Rental',
    description: t('description'),
    publisher: { '@id': `${baseUrl}#organization` },
    inLanguage: ['es', 'en', 'fr']
  };

  return (
    <html lang={locale} dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#050507" />
        <meta name="format-detection" content="telephone=yes" />
        <meta name="geo.region" content="PA" />
        <meta name="geo.placename" content="Panama City" />
        <meta name="geo.position" content="8.954117091104239;-79.541778524982" />
        <meta name="ICBM" content="8.954117091104239, -79.541778524982" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <WhatsApp />
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
