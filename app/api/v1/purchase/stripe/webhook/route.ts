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

  try {
    switch (event.type) {
      // === SUBSCRIPTION EVENTS ===

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as unknown as Record<string, unknown>;
        const metadata = sub.metadata as Record<string, string> | undefined;
        const userId = metadata?.user_id;
        const tier = (metadata?.tier || 'free') as TierId;

        if (!userId) {
          console.error('Webhook: subscription event missing user_id in metadata');
          break;
        }

        const customerId = typeof sub.customer === 'string' ? sub.customer : String(sub.customer);
        const startDate = sub.current_period_start ?? sub.start_date ?? sub.created;

        // Always calculate period end — Stripe API v2026 removed current_period_end
        const nowTs = Math.floor(Date.now() / 1000);
        let periodStart = startDate as number | undefined;
        if (!periodStart) periodStart = nowTs;

        let periodEnd = sub.current_period_end as number | undefined;
        if (!periodEnd) {
          const startMs = periodStart * 1000;
          const endDate = new Date(startMs);
          endDate.setMonth(endDate.getMonth() + 1);
          periodEnd = Math.floor(endDate.getTime() / 1000);
        }

        const { error: upsertErr } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id as string,
          tier,
          status: sub.status as string,
          current_period_start: new Date(periodStart * 1000).toISOString(),
          current_period_end: new Date(periodEnd * 1000).toISOString(),
          cancel_at_period_end: (sub.cancel_at_period_end as boolean) ?? false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'stripe_subscription_id' });

        if (upsertErr) {
          console.error('Webhook: subscription upsert failed:', upsertErr.message);
        }

        // Update tier on plans table
        const { error: planErr } = await supabase
          .from('plans')
          .update({ tier, stripe_customer_id: customerId })
          .eq('user_id', userId);

        if (planErr) {
          console.error('Webhook: plans tier update failed:', planErr.message);
        }

        // Also provision credits immediately on subscription creation
        if (event.type === 'customer.subscription.created') {
          const tierConfig = SUBSCRIPTION_TIERS[tier];
          if (tierConfig) {
            const { error: creditErr } = await supabase.rpc('refresh_subscription_credits', {
              p_user_id: userId,
              p_credits: tierConfig.credits,
              p_tier: tier,
            });
            if (creditErr) {
              console.error('Webhook: initial credit provision failed:', creditErr.message);
            }
          }
        }

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

        if (sub) {
          // Subscription record exists — refresh credits
          const tier = sub.tier as TierId;
          const tierConfig = SUBSCRIPTION_TIERS[tier];
          if (tierConfig) {
            await supabase.rpc('refresh_subscription_credits', {
              p_user_id: sub.user_id,
              p_credits: tierConfig.credits,
              p_tier: tier,
            });
          }
        } else {
          // Subscription record doesn't exist yet (race condition)
          // Fall back to looking up the Stripe subscription directly
          try {
            const stripeSub = await stripe.subscriptions.retrieve(subId);
            const metadata = stripeSub.metadata;
            const userId = metadata?.user_id;
            const tier = (metadata?.tier || 'starter') as TierId;
            const tierConfig = SUBSCRIPTION_TIERS[tier];

            if (userId && tierConfig) {
              await supabase.rpc('refresh_subscription_credits', {
                p_user_id: userId,
                p_credits: tierConfig.credits,
                p_tier: tier,
              });
            }
          } catch (e) {
            console.error('Webhook: invoice.paid fallback failed:', e);
          }
        }

        break;
      }

      // === ONE-TIME PURCHASE EVENTS (crypto top-ups via Stripe) ===

      case 'checkout.session.completed': {
        const session = event.data.object;

        // Only handle one-time payments (not subscriptions)
        if (session.mode === 'subscription') break;

        const userId = session.metadata?.user_id;

        // Handle product purchases (skills marketplace)
        if (session.metadata?.type === 'product') {
          const productId = session.metadata?.product_id;
          if (!userId || !productId) break;

          // Record the confirmed purchase in payments table
          await supabase.from('payments').insert({
            user_id: userId,
            pack: `product:${productId}`,
            credits_added: 0,
            amount_usd: (session.amount_total || 0) / 100,
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            tx_hash: session.id,
            network: 'stripe',
            metadata: {
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
              type: 'product',
              product_id: productId,
            },
          });

          break;
        }

        // Handle credit pack purchases
        const paymentId = session.metadata?.payment_id;
        const credits = Number(session.metadata?.credits);

        if (!paymentId || !userId || !credits) break;

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

        await supabase.rpc('add_credits', {
          p_user_id: userId,
          p_credits: credits,
        });

        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
