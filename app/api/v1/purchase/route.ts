import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { CREDIT_PACKS, PackId } from '@/lib/plans';

// Wallet address for receiving payments
const RECEIVING_WALLET = process.env.CRYPTO_WALLET_ADDRESS || '0x34278CCD5a1E781E586f9b49D92D3D893860Dd09';

// POST /api/v1/purchase — initiate a credit purchase
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
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
  const { data: payment, error } = await supabase.from('payments').insert({
    user_id: auth.userId,
    pack,
    credits_added: packInfo.credits,
    amount_usd: packInfo.priceUsd,
    status: 'pending',
  }).select('id').single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }

  return NextResponse.json({
    payment_id: payment.id,
    pack,
    credits: packInfo.credits,
    amount_usd: packInfo.priceUsd,
    wallet: RECEIVING_WALLET,
    instructions: `Send $${packInfo.priceUsd} in USDC/USDT/SOL to the wallet address. Then confirm with POST /api/v1/purchase/confirm with your payment_id and tx_hash.`,
  });
}
