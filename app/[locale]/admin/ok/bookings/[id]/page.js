'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#d1fae5', color: '#065f46' },
    pending: { bg: '#fef3c7', color: '#92400e' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
    'fully paid': { bg: '#dbeafe', color: '#1e40af' },
    failed: { bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '3px 12px', borderRadius: 999,
      fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase', fontFamily: 'inherit',
    }}>
      {status}
    </span>
  );
}

function Row({ label, value, accent, mono }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'baseline', padding: '9px 0',
      borderBottom: '1px solid #f0ede8',
    }}>
      <span style={{ color: '#9c8e7e', fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{
        color: accent ? '#b86e00' : '#1c1814',
        fontWeight: accent ? 700 : 600,
        fontSize: 14,
        fontFamily: mono ? 'monospace' : 'inherit',
      }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid #ede9e3',
      padding: '22px 24px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h2 style={{
          margin: 0, fontSize: 11, fontWeight: 700,
          color: '#9c8e7e', letterSpacing: '0.1em',
          textTransform: 'uppercase', fontFamily: 'inherit',
        }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

export default function BookingSharePage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/bookings/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return; }
        setBooking(data.booking);
        setAssigned(data.assigned || []);
      })
      .catch(() => setError('Failed to load booking'))
      .finally(() => setLoading(false));
  }, [id]);

  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const duration = () => {
    if (!booking?.start_date || !booking?.end_date) return 0;
    const s = new Date(booking.start_date + 'T00:00:00');
    const e = new Date(booking.end_date + 'T00:00:00');
    return Math.ceil((e - s) / 86400000) + 1;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#faf8f5',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🏍️</div>
        <p style={{ color: '#9c8e7e', fontSize: 14 }}>Loading booking…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#faf8f5',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <p style={{ color: '#991b1b', fontWeight: 600 }}>{error}</p>
      </div>
    </div>
  );

  if (!booking) return null;

  const d = duration();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #faf8f5; font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1510 0%, #2a1f14 50%, #362810 100%)',
        padding: '36px 20px 30px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'repeating-linear-gradient(-45deg, #c47f17 0, #c47f17 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{
              background: '#c47f17', color: '#fff',
              padding: '3px 10px', borderRadius: 4,
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>
              XOPA Moto Rental
            </span>
            <button
              onClick={copyLink}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: copied ? '#10b981' : 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', borderRadius: 8,
                padding: '6px 14px', fontSize: 12,
                fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: 'inherit',
              }}
            >
              {copied ? '✅ Copied!' : '🔗 Copy link'}
            </button>
          </div>

          <p style={{ color: '#9c8271', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Booking #{String(booking.id).slice(0, 8).toUpperCase()}
          </p>
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(26px, 5vw, 38px)',
            color: '#fff', lineHeight: 1.15, marginBottom: 14,
          }}>
            {booking.first_name} {booking.last_name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{
              background: 'rgba(255,255,255,0.08)', color: '#e8d5b0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}>
              🏍️ SPI RX250
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.08)', color: '#e8d5b0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}>
              📍 {booking.pickup_location || 'Panama City'}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.08)', color: '#e8d5b0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}>
              {booking.bike_quantity} bike{booking.bike_quantity > 1 ? 's' : ''}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.08)', color: '#e8d5b0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600,
            }}>
              {d} day{d !== 1 ? 's' : ''}
            </span>
            <StatusBadge status={booking.status} />
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 64px' }}>

        {/* Customer */}
        <Section title="Customer" icon="👤">
          <Row label="Full Name" value={`${booking.first_name} ${booking.last_name}`} />
          <Row label="Email" value={booking.email} />
          <Row label="Phone" value={booking.phone} />
          <Row label="Country" value={booking.country} />
          <Row label="Heard via" value={booking.hear_about_us} />
        </Section>

        {/* Trip */}
        <Section title="Trip Details" icon="📅">
          <Row label="Start Date" value={fmt(booking.start_date)} />
          <Row label="End Date" value={fmt(booking.end_date)} />
          <Row label="Duration" value={`${d} day${d !== 1 ? 's' : ''}`} />
          <Row label="Bikes" value={booking.bike_quantity} />
          <Row label="Pickup Location" value={booking.pickup_location || 'Panama City'} />
          {booking.special_requests && (
            <div style={{
              marginTop: 12, padding: '12px 14px',
              background: '#faf8f5', borderRadius: 10,
              border: '1px solid #ede9e3',
            }}>
              <p style={{ fontSize: 11, color: '#9c8e7e', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Special Requests
              </p>
              <p style={{ fontSize: 14, color: '#3d3020', lineHeight: 1.6 }}>{booking.special_requests}</p>
            </div>
          )}
        </Section>

        {/* Assigned motorcycles */}
        <Section title="Assigned Motorcycles" icon="🏍️">
          {assigned.length === 0 ? (
            <p style={{ color: '#9c8e7e', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>
              No motorcycles assigned yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assigned.map((moto, i) => (
                <div key={moto.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff7e6', border: '1px solid #f0d888',
                  borderRadius: 10, padding: '11px 16px',
                }}>
                  <span style={{ fontSize: 20 }}>🏍️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#1c1814' }}>{moto.name}</div>
                    <div style={{ fontSize: 12, color: '#9c8e7e', marginTop: 1 }}>{moto.model || 'SPI RX250'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Pricing */}
        <Section title="Pricing" icon="💰">
          <Row label="Total Price" value={`$${parseFloat(booking.total_price).toFixed(2)}`} />
          <Row label="Security Deposit" value={`$${parseFloat(booking.deposit || 0).toFixed(2)} (at pickup)`} />

          <div style={{
            background: '#1c1814', borderRadius: 12,
            padding: '18px 22px', marginTop: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ color: '#9c8271', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total</div>
              <div style={{ color: '#c47f17', fontSize: 12, marginTop: 3 }}>
                {booking.paid ? '✅ Fully paid' : 'Payment pending'}
              </div>
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 26, color: '#fff', fontWeight: 400,
            }}>
              ${parseFloat(booking.total_price).toFixed(2)}
            </div>
          </div>
        </Section>

      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', color: '#c4b8aa', fontSize: 12, paddingBottom: 32, fontFamily: 'inherit' }}>
        <strong style={{ color: '#8c7e6e' }}>XOPA Moto Rental</strong> · Internal booking reference
      </div>
    </>
  );
}
