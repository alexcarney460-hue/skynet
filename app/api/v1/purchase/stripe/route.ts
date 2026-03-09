import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { CREDIT_PACKS, PackId } from '@/lib/plans';
import { getStripe } from '@/lib/stripe';

// POST /api/v1/purchase/stripe — create Stripe Checkout session
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { pack?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const pack = body.pack as PackId;
  if (!pack || !CREDIT_PACKS[pack]) {
    return NextResponse.json({
      error: 'Invalid pack. Choose: starter, pro, or scale.',
      packs: Object.entries(CREDIT_PACKS).map(([id, p]) => ({
        id,
        credits: p.credits,
        priceUsd: p.priceUsd,
      })),
    }, { status: 400 });
  }

  const packInfo = CREDIT_PACKS[pack];
  const supabase = createServiceClient();

  // Create pending payment record
  const { data: payment, error: dbError } = await supabase
    .from('payments')
    .insert({
      user_id: auth.userId,
      pack,
      credits_added: packInfo.credits,
      amount_usd: packInfo.priceUsd,
      status: 'pending',
      network: 'stripe',
    })
    .select('id')
    .single();

  if (dbError || !payment) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }

  // Build Stripe Checkout session
  const origin = request.headers.get('origin') || request.nextUrl.origin;
  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: packInfo.priceUsd * 100, // cents
            product_data: {
              name: `SkynetX ${pack.charAt(0).toUpperCase() + pack.slice(1)} Pack`,
              description: `${packInfo.credits.toLocaleString()} API credits`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/console/billing?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/console/billing?stripe=cancelled`,
      metadata: {
        payment_id: payment.id,
        user_id: auth.userId,
        pack,
        credits: String(packInfo.credits),
      },
    });

    return NextResponse.json({
      checkout_url: session.url,
      payment_id: payment.id,
    });
  } catch {
    // Mark payment as failed so it doesn't stay pending
    await supabase
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id);

    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
