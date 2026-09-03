import { routing } from '@/routing';

// Public, indexable routes. Keep in sync with app/[locale]/*.
// Admin (noindex) and booking/success (dynamic, no evergreen content) are excluded on purpose.
const routes = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/fleet', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/how-it-works', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/booking', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' }
];

// Mirrors the `as-needed` localePrefix strategy from routing.js: the default
// locale (es) is served with no prefix, other locales get their own segment.
function localizedPath(path, locale) {
  if (locale === routing.defaultLocale) return path || '/';
  return `/${locale}${path}`;
}

export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const lastModified = new Date();

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${localizedPath(path, routing.defaultLocale)}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale) => [locale, `${baseUrl}${localizedPath(path, locale)}`])
      )
    }
  }));
}
