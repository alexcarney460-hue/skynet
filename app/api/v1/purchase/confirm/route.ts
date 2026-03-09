import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { verifyTransaction } from '@/lib/verify-tx';

const RECEIVING_WALLET = process.env.CRYPTO_WALLET_ADDRESS || '0x34278CCD5a1E781E586f9b49D92D3D893860Dd09';

// POST /api/v1/purchase/confirm — submit tx hash to confirm payment
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
  const { payment_id, tx_hash } = body;

  if (!payment_id || !tx_hash) {
    return NextResponse.json({ error: 'payment_id and tx_hash required' }, { status: 400 });
  }

  // Basic tx hash format validation (EVM 0x-prefixed 64-char hex)
  if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
    return NextResponse.json({ error: 'Invalid transaction hash format. Expected 0x-prefixed 64-char hex.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Prevent tx hash replay — check it hasn't been used before
  const { data: existingTx } = await supabase
    .from('payments')
    .select('id')
    .eq('tx_hash', tx_hash)
    .eq('status', 'confirmed')
    .single();

  if (existingTx) {
    return NextResponse.json({ error: 'Transaction hash already used for a previous payment' }, { status: 409 });
  }

  // Get the pending payment
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select('*')
    .eq('id', payment_id)
    .eq('user_id', auth.userId)
    .eq('status', 'pending')
    .single();

  if (fetchErr || !payment) {
    return NextResponse.json({ error: 'Payment not found or already confirmed' }, { status: 404 });
  }

  // On-chain verification: check the tx actually sent the right token/amount to our wallet
  const verification = await verifyTransaction(
    tx_hash as `0x${string}`,
    RECEIVING_WALLET,
    payment.amount_usd,
  );

  if (!verification.verified) {
    // Mark payment as failed with reason
    await supabase.from('payments').update({
      tx_hash,
      status: 'failed',
      metadata: { verification_error: verification.error },
    }).eq('id', payment_id);

    return NextResponse.json({
      error: 'On-chain verification failed',
      reason: verification.error,
      chain_id: verification.chain_id,
    }, { status: 400 });
  }

  // Verified — mark as confirmed
  await supabase.from('payments').update({
    tx_hash,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    metadata: {
      chain_id: verification.chain_id,
      token: verification.token,
      from_address: verification.from,
      verified_amount: verification.amount_usd,
    },
  }).eq('id', payment_id);

  // Atomic credit addition via RPC — no race conditions
  const { data: newBalance } = await supabase
    .rpc('add_credits', { p_user_id: auth.userId, p_credits: payment.credits_added });

  return NextResponse.json({
    confirmed: true,
    credits_added: payment.credits_added,
    new_balance: newBalance ?? 0,
    tx_hash,
    verification: {
      chain_id: verification.chain_id,
      token: verification.token,
      from: verification.from,
      amount_verified: verification.amount_usd,
    },
  });
}
