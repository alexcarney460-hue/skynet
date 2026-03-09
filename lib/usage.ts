import { createServiceClient } from './supabase';
import { getMinuteKey, SUBSCRIPTION_TIERS, TierId } from './plans';

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
    return { allowed: false, reason: 'No credits remaining. Upgrade your plan at /console/billing.', credits: 0, rateUsed: 0 };
  }

  const credits = decremented as number;

  // Get rate limit from subscription tier (not credit balance)
  const { data: plan } = await supabase
    .from('plans')
    .select('tier')
    .eq('user_id', userId)
    .single();

  const tier = (plan?.tier as TierId) || 'free';
  const rateLimit = SUBSCRIPTION_TIERS[tier]?.ratePerMin ?? 30;

  // Atomic rate limit increment via upsert with ON CONFLICT
  const { data: rateData, error: rateErr } = await supabase
    .rpc('increment_rate_limit', { p_user_id: userId, p_minute: minute });

  const rateUsed = (rateData as number) ?? 0;

  if (rateErr || rateUsed > rateLimit) {
    // Refund the credit since we're rate-limiting
    await supabase.rpc('refund_credit', { p_user_id: userId });
    return { allowed: false, reason: `Rate limit exceeded (${rateLimit}/min on ${tier} tier). Upgrade for higher limits.`, credits: credits + 1, rateUsed };
  }

  return { allowed: true, credits, rateUsed };
}
