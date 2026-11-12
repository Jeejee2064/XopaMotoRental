import Image from 'next/image';
import { CalendarDays, MapPin, Bike, Wallet, XCircle } from 'lucide-react';

import ButtonPrimary from '@/components/ButtonPrimary';
import ButtonSecondary from '@/components/ButtonSecondary';
import { siteConfig, getFleetModel } from '@/lib/site-config';
import { getSupabaseAdmin } from '@/lib/supabase/admin-client';

export const metadata = { robots: { index: false, follow: false } };

const COPY = {
  en: { title: 'Your booking', model: 'Motorcycle', dates: 'Dates', days: 'days', day: 'day', pickup: 'Pickup location', total: 'Total price', paid: 'Paid', balance: 'Balance', deposit: 'Security deposit (card hold)', notFound: 'Booking not found', whatsapp: 'Contact us on WhatsApp', home: 'Back to site', hello: 'Hello', status: { 'fully paid': 'Fully paid', confirmed: 'Confirmed', pending: 'Pending', cancelled: 'Cancelled' } },
  es: { title: 'Tu reserva', model: 'Moto', dates: 'Fechas', days: 'días', day: 'día', pickup: 'Lugar de recogida', total: 'Precio total', paid: 'Pagado', balance: 'Saldo', deposit: 'Depósito de garantía (retención en tarjeta)', notFound: 'Reserva no encontrada', whatsapp: 'Escríbenos por WhatsApp', home: 'Volver al sitio', hello: 'Hola', status: { 'fully paid': 'Pagada', confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' } },
  fr: { title: 'Votre réservation', model: 'Moto', dates: 'Dates', days: 'jours', day: 'jour', pickup: 'Lieu de retrait', total: 'Prix total', paid: 'Payé', balance: 'Solde', deposit: 'Caution (empreinte bancaire)', notFound: 'Réservation introuvable', whatsapp: 'Nous écrire sur WhatsApp', home: 'Retour au site', hello: 'Bonjour', status: { 'fully paid': 'Payée', confirmed: 'Confirmée', pending: 'En attente', cancelled: 'Annulée' } }
};

const STATUS_STYLES = {
  'fully paid': 'bg-jaune text-noir',
  confirmed: 'bg-cyan text-noir',
  pending: 'border border-jaune text-jaune',
  cancelled: 'border border-gris/40 text-gris'
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const money = (v) => `$${(parseFloat(v) || 0).toFixed(2)}`;

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gris/10 last:border-0">
      <span className="flex items-center gap-2 text-gris text-sm">
        {Icon && <Icon size={16} className="text-cyan shrink-0" />} {label}
      </span>
      <span className="text-white text-sm text-right">{children}</span>
    </div>
  );
}

// Customer-facing, read-only view of a booking. Public by design: the booking
// UUID in the URL is the only secret, so it deliberately shows no email,
// phone, internal notes or motorcycle plates, and nothing on it is editable.
export default async function CustomerBookingPage({ params }) {
  const { locale, id } = await params;
  const c = COPY[locale] || COPY.en;
  const fmtDate = (d) =>
    d
      ? new Date(d + 'T00:00:00').toLocaleDateString(locale === 'es' ? 'es-PA' : locale, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
      : '—';

  let booking = null;
  if (UUID.test(id)) {
    const { data } = await getSupabaseAdmin().from('bookings').select('*').eq('id', id).single();
    booking = data;
  }

  const days = booking
    ? Math.max(0, Math.round((new Date(booking.end_date + 'T00:00:00') - new Date(booking.start_date + 'T00:00:00')) / 86400000) + 1)
    : 0;
  const model = booking ? getFleetModel(booking.motorcycle_model) : null;
  const total = parseFloat(booking?.total_price) || 0;
  const paidAmount = booking?.paid ? total : parseFloat(booking?.down_payment) || 0;

  return (
    <div className="min-h-screen bg-noir">
      <header className="bg-noir border-b-2 border-cyan">
        <div className="max-w-2xl mx-auto px-4 h-16 lg:h-20 flex items-center justify-between">
          <a href={locale === 'es' ? '/' : `/${locale}`} className="h-10 lg:h-12 flex items-center">
            <Image src="/logo.png" alt="Xopa Moto Rental" width={280} height={120} className="h-full w-auto object-contain" priority />
          </a>
          {booking && (
            <span className="text-xs font-heading font-bold uppercase tracking-widest text-cyan">
              #{booking.id.slice(0, 8).toUpperCase()}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 md:py-14">
        {!booking ? (
          <div className="text-center py-16">
            <XCircle size={56} className="text-cyan mx-auto mb-4" />
            <h1 className="text-3xl font-heading font-black text-white mb-6">{c.notFound}</h1>
            <ButtonPrimary href="/" text={c.home} />
          </div>
        ) : (
          <>
            <p className="text-cyan font-heading font-bold uppercase tracking-widest text-sm mb-2">
              {c.hello} {booking.first_name}
            </p>
            <div className="flex items-center gap-3 flex-wrap mb-8">
              <h1 className="text-4xl md:text-5xl font-heading font-black uppercase text-white">{c.title}</h1>
              <span className={'px-3 py-1 text-xs font-heading font-bold uppercase tracking-wide ' + (STATUS_STYLES[booking.status] || STATUS_STYLES.pending)}>
                {c.status[booking.status] || booking.status}
              </span>
            </div>

            <div className="border border-gris/20 border-t-2 border-t-cyan bg-white/[0.02] px-5 mb-6">
              <Row icon={Bike} label={c.model}>{booking.bike_quantity} × {model.label}</Row>
              <Row icon={CalendarDays} label={c.dates}>
                {fmtDate(booking.start_date)} → {fmtDate(booking.end_date)}
                <span className="block text-gris/70">{days} {days === 1 ? c.day : c.days}</span>
              </Row>
              <Row icon={MapPin} label={c.pickup}>{booking.pickup_location || 'Panama City'}</Row>
            </div>

            <div className="border border-gris/20 border-t-2 border-t-jaune bg-white/[0.02] px-5 mb-10">
              <Row icon={Wallet} label={c.total}>
                <span className="text-jaune font-heading font-bold text-lg">{money(total)}</span>
              </Row>
              <Row label={c.paid}>{money(paidAmount)}</Row>
              <Row label={c.balance}>{money(Math.max(0, total - paidAmount))}</Row>
              <Row label={c.deposit}>{money(booking.deposit)}</Row>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ButtonPrimary href={siteConfig.whatsappLink} text={c.whatsapp} external />
              <ButtonSecondary href="/" text={c.home} theme="dark" />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
