// Subscription tiers — monthly recurring via Stripe
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    credits: 100,
    ratePerMin: 30,
    priceUsd: 0,
    stripePriceId: null,
  },
  starter: {
    name: 'Starter',
    credits: 5_000,
    ratePerMin: 60,
    priceUsd: 9,
    stripePriceId: 'price_1T8xAsRyc70MXMHiercNJpPV',
  },
  pro: {
    name: 'Pro',
    credits: 25_000,
    ratePerMin: 200,
    priceUsd: 29,
    stripePriceId: 'price_1T8xAtRyc70MXMHi8DrbfU3T',
  },
  scale: {
    name: 'Scale',
    credits: 150_000,
    ratePerMin: 500,
    priceUsd: 99,
    stripePriceId: 'price_1T8xAuRyc70MXMHiTRGEeQEh',
  },
} as const;

export type TierId = keyof typeof SUBSCRIPTION_TIERS;

// Crypto top-up packs — one-time purchase for users without cards
export const CREDIT_PACKS = {
  small:  { credits: 5_000,   priceUsd: 12  },
  medium: { credits: 25_000,  priceUsd: 40  },
  large:  { credits: 150_000, priceUsd: 130 },
} as const;

export type PackId = keyof typeof CREDIT_PACKS;


// Free tier: 100 credits on signup
export const FREE_CREDITS = 100;

export function getMinuteKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}
