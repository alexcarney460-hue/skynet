import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { SUBSCRIPTION_TIERS, TierId } from '@/lib/plans';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();

  const [{ data: plan }, { data: payments }, { data: subscription }] = await Promise.all([
    supabase.from('plans').select('credits, total_purchased, tier').eq('user_id', auth.userId).single(),
    supabase.from('payments').select('*').eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('subscriptions').select('*').eq('user_id', auth.userId).in('status', ['active', 'trialing']).single(),
  ]);

  const tier = (plan?.tier as TierId) || 'free';
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  return NextResponse.json({
    credits: plan?.credits ?? 0,
    totalPurchased: plan?.total_purchased ?? 0,
    tier,
    tierName: tierConfig?.name ?? 'Free',
    ratePerMin: tierConfig?.ratePerMin ?? 30,
    monthlyCredits: tierConfig?.credits ?? 100,
    subscription: subscription ? {
      status: subscription.status,
      tier: subscription.tier,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    } : null,
    payments: payments ?? [],
  });
}
