'use client'
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Edit2, Save, X, Bike, Mail, Link2, ShieldCheck, Phone, User,
  CalendarDays, Wallet, StickyNote, Trash2, AlertTriangle, Users,
} from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { getFleetModel } from '@/lib/site-config';
import {
  getBookingMotorcycles,
  getAvailableMotorcyclesForEdit,
} from '@/lib/supabase/bookings-admin-helpers';

const EDITABLE_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'country', 'hear_about_us',
  'start_date', 'end_date', 'bike_quantity',
  'total_price', 'down_payment', 'deposit',
  'special_requests', 'important_note',
  'payment_status', 'webhook_received', 'paid',
];

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:ring-2 focus:ring-jaune focus:border-transparent outline-none';

const STATUS_STYLES = {
  'fully paid': 'bg-green-500/15 text-green-400',
  confirmed: 'bg-white/10 text-white',
  pending: 'bg-jaune/15 text-jaune',
  cancelled: 'bg-red-500/15 text-red-400',
};

const daysBetween = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return Math.max(0, Math.round((e - s) / 86400000) + 1);
};

const fmtDate = (d) =>
  d
    ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

const money = (v) => `$${(parseFloat(v) || 0).toFixed(2)}`;

/* ───────────────────────── small building blocks ───────────────────────── */

function Card({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={'bg-[#0b0b0e] border border-gris/20 border-t-2 border-t-cyan ' + className}>
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
        <h2 className="flex items-center gap-2 text-base font-heading font-bold uppercase tracking-wider text-white">
          {Icon && <Icon size={16} className="text-jaune" />} {title}
        </h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      {children}
    </div>
  );
}

const Value = ({ children, className = '' }) => (
  <p className={'font-semibold text-white break-words ' + className}>{children || '—'}</p>
);

// Re-sends the same confirmation email the customer got when the booking was
// first paid — handy when they lost it, or when an admin-created booking
// never went through the PagueloFacil webhook that normally triggers it.
function SendConfirmationMailButton({ booking, notify }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/resend-confirmation`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
      notify(`Confirmation email sent to ${data.sentTo} recipient${data.sentTo > 1 ? 's' : ''}`);
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className={
        'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 border ' +
        (sent
          ? 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25'
          : 'bg-jaune/10 text-jaune border-jaune/30 hover:bg-jaune/20')
      }
    >
      <Mail size={16} />
      {sending ? 'Sending…' : sent ? 'Confirmation sent' : 'Send confirmation email'}
    </button>
  );
}

// One row per bike, since each deposit is authorized (or not) independently.
// Generates the *stable* /pay/[id]/auth?index=N page link — never a
// PagueloFacil URL directly, since that one-time link expires after an hour
// (see app/api/pay/auth/route.js).
function DepositAuthRow({ booking, index, authCount, notify }) {
  const [sending, setSending] = useState(false);
  const authorized = authCount > index;

  const handleGenerate = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}/send-deposit-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await navigator.clipboard.writeText(data.url);
      notify(`Deposit link #${index + 1} copied to clipboard`);
    } catch (e) {
      notify('Error: ' + e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-white/70">
        {booking.bike_quantity > 1 ? `Deposit #${index + 1}` : 'Deposit'} — $375.00
      </span>
      {authorized ? (
        <span className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
          <ShieldCheck size={14} /> Authorized
        </span>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={sending}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-cyan/10 text-cyan border border-cyan/30 hover:bg-cyan/20 transition disabled:opacity-50"
        >
          <Link2 size={13} /> {sending ? 'Generating…' : 'Copy deposit link'}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────── the page ─────────────────────────────── */

export default function BookingDetailPage({ id }) {
  const router = useRouter();

  const [booking, setBooking] = useState(null);       // last saved server state
  const [draft, setDraft] = useState(null);           // working copy while editing
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [assigned, setAssigned] = useState([]);
  const [available, setAvailable] = useState([]);
  const [savingBike, setSavingBike] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const loadBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load booking');
    setBooking(data.booking);
    return data.booking;
  }, [id]);

  const loadAssigned = useCallback(async () => {
    try {
      setAssigned(await getBookingMotorcycles(id));
    } catch (e) {
      console.error('Error loading motorcycle data:', e);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadBooking(), loadAssigned()]);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadBooking, loadAssigned]);

  // Available bikes depend on the (possibly edited) date range.
  const rangeStart = draft?.start_date;
  const rangeEnd = draft?.end_date;
  useEffect(() => {
    if (!isEditing || !rangeStart || !rangeEnd) return;
    getAvailableMotorcyclesForEdit(rangeStart, rangeEnd, id)
      .then(setAvailable)
      .catch((e) => console.error('Error loading available motorcycles:', e));
  }, [isEditing, rangeStart, rangeEnd, id]);

  const isDirty = useMemo(() => {
    if (!isEditing || !booking || !draft) return false;
    return EDITABLE_FIELDS.some((f) => (booking[f] ?? '') !== (draft[f] ?? ''));
  }, [isEditing, booking, draft]);

  // Don't silently lose edits on tab close / reload.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const setField = (field, value) => setDraft((p) => ({ ...p, [field]: value }));

  const startEdit = () => { setDraft({ ...booking }); setIsEditing(true); };
  const cancelEdit = () => { setIsEditing(false); setDraft(null); };

  const patchBooking = async (updates) => {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save booking');
    await loadBooking();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      EDITABLE_FIELDS.forEach((f) => { updates[f] = draft[f]; });
      await patchBooking(updates);
      setIsEditing(false);
      setDraft(null);
      notify('Booking updated');
    } catch (e) {
      notify('Error saving booking: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (status) => {
    try {
      await patchBooking({ status });
      notify('Status updated');
    } catch (e) {
      notify('Error updating status: ' + e.message, 'error');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await patchBooking({ paid: true, status: 'fully paid', payment_status: 'paid' });
      notify('Payment marked as fully paid');
    } catch (e) {
      notify('Error updating payment: ' + e.message, 'error');
    }
  };

  const handleDelete = () =>
    setConfirm({
      msg: 'Delete this booking? This cannot be undone.',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to delete booking');
          router.push('/admin/ok?tab=bookings');
        } catch (e) {
          notify('Error deleting booking: ' + e.message, 'error');
        }
      },
    });

  const handleBikeChange = async (oldAssignmentId, newMotorcycleId) => {
    setSavingBike(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/motorcycles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldAssignmentId, newMotorcycleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update motorcycle');
      await loadAssigned();
      notify('Motorcycle updated');
    } catch (e) {
      notify('Error updating motorcycle: ' + e.message, 'error');
    } finally {
      setSavingBike(false);
    }
  };

  /* ── states ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-jaune border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-noir flex flex-col items-center justify-center gap-4 text-center px-4">
        <AlertTriangle className="text-red-400" size={36} />
        <p className="text-red-300 font-semibold">{error || 'Booking not found'}</p>
        <Link href="/admin/ok?tab=bookings" className="text-jaune font-semibold hover:underline">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const b = isEditing ? draft : booking;
  const duration = daysBetween(b.start_date, b.end_date);
  const model = getFleetModel(b.motorcycle_model);
  const riders = booking.booking_riders || [];
  const slots = Array.from({ length: b.bike_quantity || 0 }, (_, i) => assigned[i] || null);
  const shortId = String(booking.id).slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-noir pb-28">
      {/* Brand bar — same logo + cyan rule as the public site navigation */}
      <div className="bg-noir border-b-2 border-cyan">
        <div className="max-w-6xl mx-auto px-4 h-16 lg:h-20 flex items-center justify-between">
          <Link href="/" className="h-10 lg:h-12 flex items-center">
            <Image src="/logo.png" alt="Xopa Moto Rental" width={280} height={120} className="h-full w-auto object-contain" priority />
          </Link>
          <span className="text-xs font-heading font-bold uppercase tracking-widest text-cyan">Booking #{shortId}</span>
        </div>
      </div>

      {/* Sticky booking bar */}
      <div className="sticky top-0 z-40 bg-noir/95 backdrop-blur border-b border-jaune/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/admin/ok?tab=bookings"
            className="flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-jaune transition shrink-0"
          >
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Bookings</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-heading font-black uppercase tracking-wide text-white truncate">
                {booking.first_name} {booking.last_name}
              </h1>
              <span className={'px-3 py-0.5 rounded-full text-xs font-semibold ' + (STATUS_STYLES[booking.status] || 'bg-white/10 text-white/60')}>
                {booking.status}
              </span>
              {booking.important_note && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  ⚠️ Important
                </span>
              )}
            </div>
            <p className="text-xs text-white/50">
              <span className="text-cyan font-semibold">{model.label}</span> · {fmtDate(booking.start_date)} → {fmtDate(booking.end_date)}
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2 bg-jaune text-noir font-heading font-bold uppercase tracking-wide hover:bg-cyan transition-colors shrink-0"
            >
              <Edit2 size={16} /> Edit
            </button>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-3">
        {/* ── Left / main column ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Customer" icon={User}>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'First name', field: 'first_name', type: 'text' },
                { label: 'Last name', field: 'last_name', type: 'text' },
                { label: 'Email', field: 'email', type: 'email' },
                { label: 'Phone', field: 'phone', type: 'tel' },
                { label: 'Country', field: 'country', type: 'text' },
              ].map(({ label, field, type }) => (
                <Field key={field} label={label}>
                  {isEditing ? (
                    <input type={type} value={b[field] || ''} onChange={(e) => setField(field, e.target.value)} className={inputClass} />
                  ) : field === 'email' && b.email ? (
                    <a href={`mailto:${b.email}`} className="font-semibold text-jaune hover:underline break-all">{b.email}</a>
                  ) : field === 'phone' && b.phone ? (
                    <a href={`https://wa.me/${b.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-green-400 hover:underline inline-flex items-center gap-1">
                      <Phone size={13} /> {b.phone}
                    </a>
                  ) : (
                    <Value>{b[field]}</Value>
                  )}
                </Field>
              ))}
              <Field label="How did they hear about us?">
                {isEditing ? (
                  <select value={b.hear_about_us || ''} onChange={(e) => setField('hear_about_us', e.target.value)} className={inputClass}>
                    <option value="" className="bg-[#131316]">Select...</option>
                    {['walk-in', 'google', 'social-media', 'referral', 'other'].map((o) => (
                      <option key={o} value={o} className="bg-[#131316]">{o}</option>
                    ))}
                  </select>
                ) : (
                  <Value className="capitalize">{b.hear_about_us}</Value>
                )}
              </Field>
            </div>
          </Card>

          {riders.length > 0 && (
            <Card title={`Additional riders (${riders.length})`} icon={Users}>
              <div className="grid sm:grid-cols-2 gap-3">
                {riders.map((r) => (
                  <div key={r.id} className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm space-y-1">
                    <p className="text-xs font-bold text-jaune">Rider {r.rider_index}</p>
                    <p className="font-semibold text-white">{r.first_name} {r.last_name}</p>
                    {r.email && <a href={`mailto:${r.email}`} className="block text-jaune hover:underline break-all">{r.email}</a>}
                    {r.phone && (
                      <a href={`https://wa.me/${r.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="block text-green-400 hover:underline">
                        {r.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Trip" icon={CalendarDays}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Start date">
                {isEditing ? (
                  <input type="date" value={b.start_date || ''} onChange={(e) => setField('start_date', e.target.value)} className={inputClass} />
                ) : <Value>{fmtDate(b.start_date)}</Value>}
              </Field>
              <Field label="End date">
                {isEditing ? (
                  <input type="date" value={b.end_date || ''} onChange={(e) => setField('end_date', e.target.value)} className={inputClass} />
                ) : <Value>{fmtDate(b.end_date)}</Value>}
              </Field>
              <Field label="Duration"><Value>{duration} day{duration !== 1 ? 's' : ''}</Value></Field>
              <Field label="Bikes">
                {isEditing ? (
                  <input type="number" min="1" value={b.bike_quantity} onChange={(e) => setField('bike_quantity', parseInt(e.target.value) || 1)} className={inputClass} />
                ) : <Value>{b.bike_quantity}</Value>}
              </Field>
              <Field label="Model"><Value>{model.label}</Value></Field>
              <Field label="Pickup location"><Value>{b.pickup_location || 'Panama City'}</Value></Field>
            </div>
          </Card>

          <Card title="Assigned motorcycles" icon={Bike}>
            <div className="space-y-3">
              {slots.map((slot, i) => {
                const current = slot?.motorcycle_id || '';
                const name = slot?.motorcycles?.name || '';
                return (
                  <Field key={i} label={`Motorcycle ${i + 1}`}>
                    {isEditing ? (
                      <select
                        value={current}
                        onChange={(e) => handleBikeChange(current || null, e.target.value)}
                        disabled={savingBike}
                        className={inputClass + ' disabled:opacity-50'}
                      >
                        <option value="" className="bg-[#131316]">Select a motorcycle...</option>
                        {current && name && <option value={current} className="bg-[#131316]">{name} (current)</option>}
                        {available.filter((m) => m.id !== current).map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#131316]">{m.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-3 bg-jaune/10 p-3 rounded-lg">
                        <Bike size={18} className="text-jaune" />
                        <span className="font-semibold text-white">{name || 'Not assigned'}</span>
                      </div>
                    )}
                  </Field>
                );
              })}
              {isEditing && available.length === 0 && (
                <p className="p-3 bg-jaune/10 border border-jaune/25 rounded-lg text-sm text-jaune">
                  ⚠️ No available bikes for this date range.
                </p>
              )}
              {isEditing && (
                <p className="text-xs text-white/40">Bike swaps are applied immediately, they don’t need “Save”.</p>
              )}
            </div>
          </Card>

          <Card
            title="Special requests"
            icon={StickyNote}
            action={isEditing && (
              <label className="flex items-center gap-2 text-sm font-semibold text-red-400 cursor-pointer select-none">
                <input type="checkbox" checked={!!b.important_note} onChange={(e) => setField('important_note', e.target.checked)} className="w-4 h-4 rounded text-red-500 focus:ring-red-400" />
                ⚠️ Important
              </label>
            )}
          >
            {isEditing ? (
              <textarea
                value={b.special_requests || ''}
                onChange={(e) => setField('special_requests', e.target.value)}
                rows={5}
                placeholder="Enter any special requests..."
                className={'w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-jaune outline-none text-white ' + (b.important_note ? 'border border-red-500/30 bg-red-500/10' : 'border border-white/10 bg-white/5')}
              />
            ) : (
              <p className={'p-4 rounded-lg whitespace-pre-wrap ' + (b.important_note ? 'bg-red-500/10 border border-red-500/25 text-red-300 font-medium' : 'bg-white/5 text-white/70')}>
                {b.special_requests || 'No special requests'}
              </p>
            )}
          </Card>
        </div>

        {/* ── Right / sidebar column ── */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card title="Status" icon={ShieldCheck}>
            <select
              value={booking.status}
              onChange={(e) => handleStatus(e.target.value)}
              disabled={isEditing}
              className={inputClass + ' disabled:opacity-50'}
            >
              <option value="pending" className="bg-[#131316]">Pending</option>
              <option value="confirmed" className="bg-[#131316]">Confirmed</option>
              <option value="fully paid" className="bg-[#131316]">Fully paid</option>
              <option value="cancelled" className="bg-[#131316]">Cancelled</option>
            </select>
          </Card>

          <Card title="Payment" icon={Wallet}>
            <div className="space-y-3">
              {[
                { label: 'Total price', field: 'total_price' },
                { label: 'Down payment', field: 'down_payment' },
                { label: 'Security deposit', field: 'deposit' },
              ].map(({ label, field }) => (
                <div key={field} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white/50">{label}</span>
                  {isEditing ? (
                    <input
                      type="number" step="0.01" value={b[field] ?? ''}
                      onChange={(e) => setField(field, parseFloat(e.target.value))}
                      className={inputClass + ' !w-28 text-right'}
                    />
                  ) : (
                    <span className="font-semibold text-white">{money(b[field])}</span>
                  )}
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <span className="text-sm font-bold text-white">Payment</span>
                {isEditing ? (
                  <select
                    value={b.payment_status || 'pending'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((p) => ({ ...p, payment_status: val, webhook_received: val === 'paid', paid: val === 'paid' }));
                    }}
                    className="px-2 py-1 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-semibold focus:ring-2 focus:ring-jaune outline-none"
                  >
                    <option value="pending" className="bg-[#131316]">⏳ Pending</option>
                    <option value="paid" className="bg-[#131316]">✅ Paid</option>
                    <option value="failed" className="bg-[#131316]">❌ Failed</option>
                  </select>
                ) : (
                  <span className={'font-bold ' + (b.paid ? 'text-green-400' : 'text-red-400')}>
                    {b.paid ? 'PAID' : b.payment_status === 'failed' ? 'FAILED' : 'PENDING'}
                  </span>
                )}
              </div>

              {!booking.paid && !isEditing && (
                <button onClick={handleMarkPaid} className="w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
                  Mark as fully paid
                </button>
              )}

              {!isEditing && (
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-wide mb-1">Deposit authorization (card hold)</p>
                  {Array.from({ length: booking.bike_quantity || 1 }, (_, i) => (
                    <DepositAuthRow key={i} booking={booking} index={i} authCount={booking.auth_count || 0} notify={notify} />
                  ))}
                </div>
              )}
            </div>
          </Card>

          {!isEditing && (
            <Card title="Actions">
              <div className="space-y-3">
                <SendConfirmationMailButton booking={booking} notify={notify} />
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(`${window.location.origin}/customerbookings/${booking.id}`);
                    notify('Customer link copied');
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-cyan border border-cyan/30 hover:bg-cyan/10 transition"
                >
                  <Link2 size={16} /> Copy customer link
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition"
                >
                  <Trash2 size={16} /> Delete booking
                </button>
              </div>
            </Card>
          )}
        </aside>
      </main>

      {/* Sticky save bar — only while editing */}
      {isEditing && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-[#131316]/95 backdrop-blur border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <p className={'text-sm font-semibold ' + (isDirty ? 'text-jaune' : 'text-white/40')}>
              {isDirty ? '● Unsaved changes' : 'No changes yet'}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={cancelEdit} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 transition disabled:opacity-50">
                <X size={16} /> {isDirty ? 'Discard' : 'Close'}
              </button>
              <button onClick={handleSave} disabled={saving || !isDirty} className="flex items-center gap-2 px-5 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-40">
                <Save size={16} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed ${isEditing ? 'bottom-20' : 'bottom-6'} right-6 z-[200] px-5 py-3.5 rounded-xl shadow-2xl text-sm font-semibold border ${
          toast.type === 'error' ? 'bg-red-500/95 border-red-400/30 text-white' : 'bg-jaune border-jaune text-noir'
        }`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[200] p-4">
          <div className="bg-[#141417] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-white font-semibold mb-6 text-center">{confirm.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={async () => { const fn = confirm.onConfirm; setConfirm(null); await fn(); }}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition"
              >
                Confirm
              </button>
              <button onClick={() => setConfirm(null)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
