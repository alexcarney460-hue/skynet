import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const paymentId = session.metadata?.payment_id;
    const userId = session.metadata?.user_id;
    const credits = Number(session.metadata?.credits);

    if (!paymentId || !userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createServiceClient();

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

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

    // Atomic credit addition — no race conditions
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_credits: credits,
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
