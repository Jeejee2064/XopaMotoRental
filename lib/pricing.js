// RX250 day-tier pricing — $60/day base, degressive at the same proportions
// (per-day-rate / day-1-rate, averaged across Himalayan and CF Moto 700) as
// Overland's tables in Overland Motorcycles/overland-motorcycles/app/[locale]/Pricing/page.js.
// Kept in sync with messages/*.json PricingPage.dayPrice/weekPrice/monthPrice
// (days 1, 7, 30) — update both places together.
//
// Lookup mirrors Overland's approach: an exact day match wins; otherwise the
// next tier up applies; beyond the last tier, the per-day rate of the last
// tier is extrapolated.
export const RX250_PRICING = [
  { days: 1, price: 60 },
  { days: 2, price: 60 },
  { days: 3, price: 85 },
  { days: 4, price: 113 },
  { days: 5, price: 140 },
  { days: 6, price: 168 },
  { days: 7, price: 192 },
  { days: 14, price: 302 },
  { days: 21, price: 383 },
  { days: 30, price: 420 }
];

export function getRentalPriceForDays(days, pricing = RX250_PRICING) {
  if (!days || days < 1) return 0;
  const exact = pricing.find((p) => p.days === days);
  if (exact) return exact.price;

  const sorted = [...pricing].sort((a, b) => a.days - b.days);
  for (let i = 0; i < sorted.length - 1; i++) {
    if (days > sorted[i].days && days < sorted[i + 1].days) return sorted[i + 1].price;
  }
  const last = sorted[sorted.length - 1];
  if (days > last.days) return Math.round((last.price / last.days) * days);
  return sorted[0].price;
}

// Panama ITBMS sales tax + typical card-processing fee — same rates Overland
// applies, these are Panama/processor facts rather than brand-specific ones.
export const ITBMS_RATE = 0.07;
export const CARD_FEE_RATE = 0.035;

export function calculateBookingTotal({ days, bikeQuantity }) {
  const rentalPrice = getRentalPriceForDays(days);
  const subtotal = rentalPrice * bikeQuantity;
  const tax = subtotal * ITBMS_RATE;
  const withTax = subtotal + tax;
  const cardFee = withTax * CARD_FEE_RATE;
  const total = withTax + cardFee;
  return { rentalPrice, subtotal, tax, cardFee, total };
}
