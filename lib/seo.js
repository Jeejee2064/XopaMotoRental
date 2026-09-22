// Per-page metadata builder for the App Router.
//
// Next.js only shallow-merges metadata objects: if a layout's
// generateMetadata doesn't return `alternates`/`openGraph`, it inherits the
// PARENT's entire object as-is (not just the missing keys). Every nested
// layout under app/[locale]/layout.js was previously title/description-only,
// so every subpage silently inherited the root layout's homepage canonical,
// hreflang alternates and og:url — Google saw /fleet, /pricing, /contact,
// /how-it-works and /booking as duplicates of the homepage. This helper
// rebuilds those fields per page so each route gets its own canonical URL.
import { routing } from '@/routing';

const hreflangMap = { es: 'es-419', en: 'en-US', fr: 'fr-FR' };
const ogLocaleMap = { es: 'es_PA', en: 'en_US', fr: 'fr_FR' };

function localizedPath(path, locale) {
  if (locale === routing.defaultLocale) return path || '/';
  return `/${locale}${path}`;
}

export function pageMetadata({ locale, path, title, description, keywords, image = '/og-image.jpg' }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const canonicalUrl = `${baseUrl}${localizedPath(path, locale)}`;

  const languages = Object.fromEntries(
    routing.locales.map((locale_) => [hreflangMap[locale_], `${baseUrl}${localizedPath(path, locale_)}`])
  );
  languages['x-default'] = `${baseUrl}${localizedPath(path, routing.defaultLocale)}`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'XOPA Moto Rental',
      locale: ogLocaleMap[locale] || 'es_PA',
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}
