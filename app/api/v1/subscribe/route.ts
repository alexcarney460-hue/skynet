import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { SUBSCRIPTION_TIERS, TierId } from '@/lib/plans';
import { getStripe } from '@/lib/stripe';

// POST /api/v1/subscribe — create Stripe Checkout for subscription
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { tier?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const tier = body.tier as TierId;
  if (!tier || !SUBSCRIPTION_TIERS[tier] || tier === 'free') {
    return NextResponse.json({
      error: 'Invalid tier. Choose: starter, pro, or scale.',
      tiers: Object.entries(SUBSCRIPTION_TIERS)
        .filter(([id]) => id !== 'free')
        .map(([id, t]) => ({
          id,
          name: t.name,
          credits: t.credits,
          ratePerMin: t.ratePerMin,
          priceUsd: t.priceUsd,
        })),
    }, { status: 400 });
  }

  const tierInfo = SUBSCRIPTION_TIERS[tier];
  if (!tierInfo.stripePriceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 500 });
  }

  const supabase = createServiceClient();
  const stripe = getStripe();

  // Check for existing subscription
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, tier, status')
    .eq('user_id', auth.userId)
    .in('status', ['active', 'trialing'])
    .single();

  if (existing) {
    // User already has an active subscription — offer to change tier
    return NextResponse.json({
      error: 'You already have an active subscription. Use /api/v1/subscribe/manage to change plans or cancel.',
      current_tier: existing.tier,
      current_status: existing.status,
    }, { status: 409 });
  }

  // Get or create Stripe customer
  const { data: plan } = await supabase
    .from('plans')
    .select('stripe_customer_id')
    .eq('user_id', auth.userId)
    .single();

  let customerId = plan?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { user_id: auth.userId },
    });
    customerId = customer.id;

    await supabase
      .from('plans')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', auth.userId);
  }

  // Create Checkout session for subscription
  const origin = request.headers.get('origin') || request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: tierInfo.stripePriceId, quantity: 1 }],
    success_url: `${origin}/console/billing?subscribed=${tier}`,
    cancel_url: `${origin}/console/billing?cancelled=true`,
    metadata: {
      user_id: auth.userId,
      tier,
    },
    subscription_data: {
      metadata: {
        user_id: auth.userId,
        tier,
        credits: String(tierInfo.credits),
        rate_per_min: String(tierInfo.ratePerMin),
      },
    },
  });

  return NextResponse.json({
    checkout_url: session.url,
    tier,
  });
}
