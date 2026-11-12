// Single source of truth for contact details & cross-brand links.
//
// Overland Motorcycles' codebase ended up with its phone number, WhatsApp
// link and business address hardcoded independently in ~10 different files
// (API routes, email templates, layout.js, contact page...). Centralizing it
// here from day one avoids repeating that when the backend phase wires up
// bookings/emails/admin.

export const siteConfig = {
  companyName: 'XOPA Moto Rental',

  // Same office & phone line as Overland Motorcycles (same owners).
  phone: '+507 6805-1100',
  phoneIntl: '+507-6805-1100',
  whatsappNumber: '50768051100',
  get whatsappLink() {
    return `https://wa.me/${this.whatsappNumber}`;
  },

  email: 'xopamotorental@gmail.com',

  // "New booking" admin notifications. Override with ADMIN_NOTIFICATION_EMAIL
  // if a different inbox should receive these.
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'xopamotorental@gmail.com',

  // Current fleet — two models, one location. `id` is what's stored in
  // `motorcycles.model` / `bookings.motorcycle_model`; see lib/pricing.js for
  // per-model rates. Add a model here (plus pricing + messages FleetPage entry)
  // and the booking flow, fleet page, emails and admin pick it up.
  fleet: {
    location: 'Panama City',
    models: [
      {
        id: 'RX250',
        brand: 'SPI',
        name: 'RX250',
        label: 'SPI RX250',
        messageKey: 'rx250',
        images: ['/hero.jpeg', '/RX250.jpeg', '/riding.jpeg']
      },
      {
        id: 'G310GS',
        brand: 'BMW',
        name: 'G 310 GS',
        label: 'BMW G 310 GS',
        messageKey: 'g310gs',
        images: ['/fleet/g310gs-1.jpg', '/fleet/g310gs-2.jpg', '/fleet/g310gs-3.jpg'],
        // Wikimedia Commons photos (user "Wikisympathisant"), CC BY-SA 4.0 —
        // the licence requires this credit to be shown next to the images.
        imageCredit: 'Wikisympathisant / Wikimedia Commons, CC BY-SA 4.0'
      }
    ]
  },

  address: 'Ph Jerónimo, Avenida B y calle 10 este, planta baja, San Felipe, Ciudad de Panamá',
  addressLocality: 'Panama City',
  addressCountry: 'PA',
  geo: { latitude: 8.954117091104239, longitude: -79.541778524982 }
};

// Reciprocal backlinks with partner sites. Overland is a sibling brand with a
// bigger-cc adventure fleet; Panama Contact is an unrelated immigration/residency
// advisory service exchanging links for SEO.
export const crossLinks = [
  {
    key: 'overland',
    href: 'https://overland-motorcycles.com'
  },
  {
    key: 'panamaContact',
    href: 'https://panama-contact.com'
  }
];

// Accommodation referral partner. Unlike crossLinks above, clicks on this one
// are tracked (see app/api/track-partner-click) and trigger an admin email —
// this is a referral relationship, not a reciprocal SEO backlink.
export const acomodoRentals = {
  href: 'https://acomodorentals.com/'
};

// Look up a fleet model by the id stored in the DB. Unknown ids (old rows,
// typos) fall back to a generic entry so emails/pages never crash.
export function getFleetModel(id) {
  return (
    siteConfig.fleet.models.find((m) => m.id === id) || {
      id,
      brand: '',
      name: id || '',
      label: id || '',
      images: []
    }
  );
}
