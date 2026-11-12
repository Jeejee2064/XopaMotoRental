// RX250 day-tier pricing — $60/day flat for 1-2 days (no discount, matching
// Overland's tables where the 2-day price is exactly 2x the daily rate),
// then degressive from day 3 on at the same proportions (per-day-rate /
// day-2-rate, averaged across Himalayan and CF Moto 700) as Overland's
// tables in Overland Motorcycles/overland-motorcycles/app/[locale]/Pricing/page.js.
// Kept in sync with messages/*.json PricingPage.dayPrice/weekPrice/monthPrice
// (days 1, 7, 30) — update both places together.
//
// Lookup: an exact day match wins; between two tiers the price is linearly
// interpolated; beyond the last tier, the per-day rate of the last tier is
// extrapolated.
export const RX250_PRICING = [
  { days: 1, price: 60 },
  { days: 2, price: 120 },
  { days: 3, price: 170 },
  { days: 4, price: 226 },
  { days: 5, price: 282 },
  { days: 6, price: 338 },
  { days: 7, price: 384 },
  { days: 14, price: 604 },
  { days: 21, price: 766 },
  { days: 30, price: 840 }
];

// BMW G 310 GS — same tiers as the RX250 until its own rate card is set.
// Edit these numbers (and messages PricingPage) when the pricing differs.
export const G310GS_PRICING = RX250_PRICING.map((tier) => ({ ...tier }));

export const MODEL_PRICING = {
  RX250: RX250_PRICING,
  G310GS: G310GS_PRICING
};

export function getPricingForModel(model) {
  return MODEL_PRICING[model] || RX250_PRICING;
}

export function getRentalPriceForDays(days, pricing = RX250_PRICING) {
  if (!days || days < 1) return 0;
  const exact = pricing.find((p) => p.days === days);
  if (exact) return exact.price;

  const sorted = [...pricing].sort((a, b) => a.days - b.days);
  for (let i = 0; i < sorted.length - 1; i++) {
    const lo = sorted[i];
    const hi = sorted[i + 1];
    if (days > lo.days && days < hi.days) {
      // Interpolate linearly between the two surrounding tiers so the price
      // always grows with the number of days and never exceeds the next tier.
      const perDay = (hi.price - lo.price) / (hi.days - lo.days);
      return Math.round(lo.price + perDay * (days - lo.days));
    }
  }
  const last = sorted[sorted.length - 1];
  if (days > last.days) return Math.round((last.price / last.days) * days);
  return sorted[0].price;
}

// Panama ITBMS sales tax + typical card-processing fee — same rates Overland
// applies, these are Panama/processor facts rather than brand-specific ones.
export const ITBMS_RATE = 0.07;
export const CARD_FEE_RATE = 0.035;

export function calculateBookingTotal({ days, bikeQuantity, model }) {
  const rentalPrice = getRentalPriceForDays(days, getPricingForModel(model));
  const subtotal = rentalPrice * bikeQuantity;
  const tax = subtotal * ITBMS_RATE;
  const withTax = subtotal + tax;
  const cardFee = withTax * CARD_FEE_RATE;
  const total = withTax + cardFee;
  return { rentalPrice, subtotal, tax, cardFee, total };
}
