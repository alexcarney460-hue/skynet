import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { CREDIT_PACKS, PackId } from '@/lib/plans';

// Wallet addresses for receiving payments
const RECEIVING_WALLET = process.env.CRYPTO_WALLET_ADDRESS || '0x34278CCD5a1E781E586f9b49D92D3D893860Dd09';
const SOLANA_RECEIVING_WALLET = process.env.SOLANA_WALLET_ADDRESS || '';

// POST /api/v1/purchase — initiate a credit purchase
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const pack = body.pack as PackId;
  const network = body.network === 'solana' ? 'solana' : 'evm';

  if (network === 'solana' && !SOLANA_RECEIVING_WALLET) {
    return NextResponse.json({ error: 'Solana payments not configured yet' }, { status: 503 });
  }

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
    network,
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
    solana_wallet: network === 'solana' ? SOLANA_RECEIVING_WALLET : undefined,
    network,
    instructions: `Send $${packInfo.priceUsd} in USDC/USDT to the wallet address. Then confirm with POST /api/v1/purchase/confirm with your payment_id and tx_hash.`,
  });
}
