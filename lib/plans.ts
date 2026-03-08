// Credit packs — prepaid, no subscriptions
export const CREDIT_PACKS = {
  starter:  { credits: 1_000,   priceUsd: 5,   ratePerMin: 30  },
  pro:      { credits: 10_000,  priceUsd: 29,  ratePerMin: 100 },
  scale:    { credits: 100_000, priceUsd: 99,  ratePerMin: 500 },
} as const;

export type PackId = keyof typeof CREDIT_PACKS;

// Free tier: 100 credits on signup, no purchase required
export const FREE_CREDITS = 100;

export function getMinuteKey(): string {
  const d = new Date();
  return d.toISOString().slice(0, 16);
}
