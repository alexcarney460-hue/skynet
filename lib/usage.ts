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

  // Get credit balance
  const { data: plan } = await supabase
    .from('plans')
    .select('credits')
    .eq('user_id', userId)
    .single();

  const credits = plan?.credits ?? 0;

  if (credits <= 0) {
    return { allowed: false, reason: 'No credits remaining. Purchase more at /console/billing.', credits: 0, rateUsed: 0 };
  }

  // Check rate limit (30/min baseline, scales with balance)
  const rateLimit = credits >= 10_000 ? 500 : credits >= 1_000 ? 100 : 30;

  const { data: rate } = await supabase
    .from('rate_limits')
    .select('calls')
    .eq('user_id', userId)
    .eq('minute', minute)
    .single();

  const rateUsed = rate?.calls ?? 0;

  if (rateUsed >= rateLimit) {
    return { allowed: false, reason: 'Rate limit exceeded. Slow down.', credits, rateUsed };
  }

  // Deduct 1 credit
  await supabase
    .from('plans')
    .update({ credits: credits - 1 })
    .eq('user_id', userId);

  // Increment rate counter
  if (rate) {
    await supabase.from('rate_limits').update({ calls: rateUsed + 1 }).eq('user_id', userId).eq('minute', minute);
  } else {
    await supabase.from('rate_limits').insert({ user_id: userId, minute, calls: 1 });
  }

  return { allowed: true, credits: credits - 1, rateUsed: rateUsed + 1 };
}
