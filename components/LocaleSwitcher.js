'use client';

import { useRouter, usePathname } from '../navigation';
import { useParams } from 'next/navigation';
import { Globe } from 'lucide-react';

const locales = [
  { code: 'es', name: 'ES', fullName: 'Español' },
  { code: 'en', name: 'EN', fullName: 'English' },
  { code: 'fr', name: 'FR', fullName: 'Français' }
];

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale || 'es';

  function handleChange(nextLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-2">
      <Globe size={18} className="text-gris/60" />
      <div className="flex gap-1">
        {locales.map((locale) => (
          <button
            key={locale.code}
            onClick={() => handleChange(locale.code)}
            className={`px-3 py-1.5 rounded text-sm font-bold tracking-wide transition-colors duration-150 cursor-pointer ${
              currentLocale === locale.code
                ? 'bg-jaune text-noir'
                : 'text-gris/70 hover:text-jaune'
            }`}
            title={locale.fullName}
          >
            {locale.name}
          </button>
        ))}
      </div>
    </div>
  );
}
