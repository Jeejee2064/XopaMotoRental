import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Spanish (Latin America) is the primary audience, so it is the default locale.
  locales: ['es', 'en', 'fr'],

  // Used when no locale matches
  defaultLocale: 'es',

  // The `localePrefix` setting controls whether a locale prefix is shown for
  // the default locale. Setting this to `as-needed` will hide the prefix for
  // the default locale (es) and only show it for /en and /fr.
  localePrefix: 'as-needed'
});
