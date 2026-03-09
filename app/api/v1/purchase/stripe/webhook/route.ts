import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';
import { SUBSCRIPTION_TIERS, TierId } from '@/lib/plans';

export const runtime = 'nodejs';

// POST /api/v1/purchase/stripe/webhook — Stripe webhook handler
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    // === SUBSCRIPTION EVENTS ===

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as unknown as Record<string, unknown>;
      const metadata = sub.metadata as Record<string, string> | undefined;
      const userId = metadata?.user_id;
      const tier = (metadata?.tier || 'free') as TierId;

      if (!userId) break;

      const customerId = typeof sub.customer === 'string' ? sub.customer : String(sub.customer);
      const periodStart = sub.current_period_start ?? sub.start_date;
      const periodEnd = sub.current_period_end ?? sub.ended_at;

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id as string,
        tier,
        status: sub.status as string,
        current_period_start: periodStart ? new Date((periodStart as number) * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date((periodEnd as number) * 1000).toISOString() : null,
        cancel_at_period_end: (sub.cancel_at_period_end as boolean) ?? false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_subscription_id' });

      // Update tier on plans table
      await supabase
        .from('plans')
        .update({ tier, stripe_customer_id: customerId })
        .eq('user_id', userId);

      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as unknown as Record<string, unknown>;
      const metadata = sub.metadata as Record<string, string> | undefined;
      const userId = metadata?.user_id;

      if (!userId) break;

      await supabase.from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id as string);

      // Downgrade to free tier
      await supabase.rpc('downgrade_to_free', { p_user_id: userId });

      break;
    }

    case 'invoice.paid': {
      // Monthly credit refresh — fires on each successful billing cycle
      const invoice = event.data.object as unknown as Record<string, unknown>;
      const subId = invoice.subscription as string | null;

      if (!subId) break;

      // Look up subscription to get user_id and tier
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id, tier')
        .eq('stripe_subscription_id', subId)
        .single();

      if (!sub) break;

      const tier = sub.tier as TierId;
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      if (!tierConfig) break;

      // Refresh credits to the tier's monthly allowance
      await supabase.rpc('refresh_subscription_credits', {
        p_user_id: sub.user_id,
        p_credits: tierConfig.credits,
        p_tier: tier,
      });

      break;
    }

    // === ONE-TIME PURCHASE EVENTS (legacy + crypto top-ups) ===

    case 'checkout.session.completed': {
      const session = event.data.object;

      // Only handle one-time payments (not subscriptions)
      if (session.mode === 'subscription') break;

      const paymentId = session.metadata?.payment_id;
      const userId = session.metadata?.user_id;
      const credits = Number(session.metadata?.credits);

      if (!paymentId || !userId || !credits) break;

      // Mark payment as confirmed
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          tx_hash: session.id,
          metadata: {
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
            stripe_payment_status: session.payment_status,
          },
        })
        .eq('id', paymentId)
        .eq('status', 'pending');

      if (updateError) break;

      // Atomic credit addition
      await supabase.rpc('add_credits', {
        p_user_id: userId,
        p_credits: credits,
      });

      break;
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
