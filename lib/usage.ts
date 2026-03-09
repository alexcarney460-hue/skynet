import { createServiceClient } from './supabase';
import { getMinuteKey } from './plans';

interface UsageCheck {
  allowed: boolean;
  reason?: string;
  credits: number;
  rateUsed: number;
}

export async function checkAndDecrement(userId: string): Promise<UsageCheck> {
  const supabase = createServiceClient();
  const minute = getMinuteKey();

  // Atomic credit deduction via RPC — single SQL operation, no race condition
  const { data: decremented, error: decrErr } = await supabase
    .rpc('decrement_credit', { p_user_id: userId });

  // RPC returns the new credit balance, or -1 if no credits remain
  if (decrErr || decremented === null || decremented < 0) {
    return { allowed: false, reason: 'No credits remaining. Purchase more at /console/billing.', credits: 0, rateUsed: 0 };
  }

  const credits = decremented as number;

  // Check rate limit (scales with balance)
  const rateLimit = credits >= 10_000 ? 500 : credits >= 1_000 ? 100 : 30;

  // Atomic rate limit increment via upsert with ON CONFLICT
  const { data: rateData, error: rateErr } = await supabase
    .rpc('increment_rate_limit', { p_user_id: userId, p_minute: minute });

  const rateUsed = (rateData as number) ?? 0;

  if (rateErr || rateUsed > rateLimit) {
    // Refund the credit since we're rate-limiting
    await supabase.rpc('refund_credit', { p_user_id: userId });
    return { allowed: false, reason: 'Rate limit exceeded. Slow down.', credits: credits + 1, rateUsed };
  }

  return { allowed: true, credits, rateUsed };
}
