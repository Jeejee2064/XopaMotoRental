'use client';
import { useState } from 'react';
import { trackFunnelStep } from '@/lib/analytics/track';

export default function AuthPayButton({ bookingId, index, locale, label }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pay/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, index, locale })
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Failed to start payment');
      trackFunnelStep('deposit_auth_started', { locale, metadata: { bookingId, index } });
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full px-8 py-4 bg-cyan text-noir font-heading font-bold text-lg uppercase tracking-wide hover:bg-jaune transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? '…' : label}
      </button>
      {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
    </div>
  );
}
