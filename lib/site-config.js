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

  // Current fleet — one model, one location. See lib/pricing.js for rates.
  fleet: {
    brand: 'SPI',
    model: 'RX250',
    location: 'Panama City'
  },

  address: 'Ph Jerónimo, Avenida B y calle 10 este, planta baja, San Felipe, Ciudad de Panamá',
  addressLocality: 'Panama City',
  addressCountry: 'PA',
  geo: { latitude: 8.954117091104239, longitude: -79.541778524982 },

  social: {
    facebook: 'https://www.facebook.com',
    instagram: 'https://www.instagram.com'
  }
};

// Cross-links between sibling brands (same ownership group). Overland has a
// bigger-cc adventure fleet; Canal Workforce is a separate, unrelated project
// by the same team. Reciprocal links (Overland -> Xopa, Canal -> Xopa) live
// in those other repos and are out of scope here.
export const crossLinks = [
  {
    key: 'overland',
    href: 'https://overland-motorcycles.com'
  },
  {
    key: 'canal',
    href: '#' // TODO: fill in the real Canal Workforce URL once known
  }
];
