'use client';

import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

// Xopa is single model/location, and the public booking flow (app/[locale]/
// booking) doesn't read query params to prefill anything (unlike Overland's
// Booking page) — so unlike Overland's generator, this just builds a
// share-in-this-language link to the booking page. Kept as its own tab
// rather than folded away, since "send them the right-language link" is
// still a real thing an admin does over WhatsApp.
const LOCALES = [
  { value: 'es', label: '🇪🇸 Español', prefix: '' },
  { value: 'en', label: '🇺🇸 English', prefix: '/en' },
  { value: 'fr', label: '🇫🇷 Français', prefix: '/fr' },
];

const BookingLinkGeneratorTab = () => {
  const [locale, setLocale] = useState('es');
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedLocale = LOCALES.find(l => l.value === locale) || LOCALES[0];

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    setGenerated(`${base}${selectedLocale.prefix}/booking`);
  }, [locale, selectedLocale.prefix]);

  const copyToClipboard = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-1 text-gray-900">Booking Link Generator</h2>
      <p className="text-sm text-gray-500 mb-5">Generates a booking page link in the customer's language.</p>

      <div className="space-y-5">

        {/* Language */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Language</label>
          <div className="grid grid-cols-3 gap-2">
            {LOCALES.map(l => (
              <button key={l.value} type="button" onClick={() => setLocale(l.value)}
                className={`p-2.5 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                  locale === l.value ? 'border-yellow-400 bg-yellow-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generated Link */}
        {generated && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-sm text-gray-700 break-all mb-3">{generated}</p>
            <button onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition">
              {copied ? <><CheckCircle size={18} className="text-green-400" /> Copied!</> : <><Copy size={18} /> Copy Link</>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingLinkGeneratorTab;
