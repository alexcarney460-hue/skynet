import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { SKILL_PRODUCTS, ProductId } from '@/lib/plans';
import { getStripe } from '@/lib/stripe';

const RECEIVING_WALLET = process.env.CRYPTO_WALLET_ADDRESS || '0x34278CCD5a1E781E586f9b49D92D3D893860Dd09';
const SOLANA_RECEIVING_WALLET = process.env.SOLANA_WALLET_ADDRESS || '';

// POST /api/v1/products/purchase — buy a skill product (Stripe or crypto)
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { product?: string; method?: string; network?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const productId = body.product as ProductId;
  if (!productId || !SKILL_PRODUCTS[productId]) {
    return NextResponse.json({
      error: 'Invalid product.',
      products: Object.entries(SKILL_PRODUCTS).map(([id, p]) => ({
        id,
        name: p.name,
        priceUsd: p.priceUsd,
        description: p.description,
      })),
    }, { status: 400 });
  }

  const product = SKILL_PRODUCTS[productId];
  const method = body.method || 'stripe';
  const supabase = createServiceClient();

  // Check if user already owns this product
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', auth.userId)
    .eq('pack', `product:${productId}`)
    .eq('status', 'confirmed')
    .single();

  if (existing) {
    return NextResponse.json({
      message: 'You already own this product.',
      product: productId,
      install: product.installCmd,
      install_windows: product.installCmdWin,
      repo: product.repoUrl,
    });
  }

  if (method === 'crypto') {
    const network = body.network === 'solana' ? 'solana' : 'evm';

    if (network === 'solana' && !SOLANA_RECEIVING_WALLET) {
      return NextResponse.json({ error: 'Solana payments not configured yet' }, { status: 503 });
    }

    // Create pending payment
    const { data: payment, error } = await supabase.from('payments').insert({
      user_id: auth.userId,
      pack: `product:${productId}`,
      credits_added: 0,
      amount_usd: product.priceUsd,
      status: 'pending',
      network,
    }).select('id').single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    return NextResponse.json({
      payment_id: payment.id,
      product: productId,
      amount_usd: product.priceUsd,
      wallet: RECEIVING_WALLET,
      solana_wallet: network === 'solana' ? SOLANA_RECEIVING_WALLET : undefined,
      network,
      instructions: `Send $${product.priceUsd} in USDC/USDT to the wallet address. Then confirm with POST /api/v1/purchase/confirm with your payment_id and tx_hash.`,
    });
  }

  // Stripe one-time checkout
  const stripe = getStripe();

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

  const origin = request.headers.get('origin') || request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          description: product.description,
        },
        unit_amount: product.priceUsd * 100,
      },
      quantity: 1,
    }],
    success_url: `${origin}/console/billing?purchased=${productId}`,
    cancel_url: `${origin}/console/billing?cancelled=true`,
    metadata: {
      user_id: auth.userId,
      product_id: productId,
      type: 'product',
    },
  });

  return NextResponse.json({
    checkout_url: session.url,
    product: productId,
  });
}
