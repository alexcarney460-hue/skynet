import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';

// POST /api/v1/purchase/confirm — submit tx hash to confirm payment
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { payment_id, tx_hash } = await request.json();

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

  // Mark as confirmed and record tx hash
  // TODO: Add on-chain verification via RPC provider (viem getTransactionReceipt)
  // to verify recipient, token, and amount match before crediting.
  await supabase.from('payments').update({
    tx_hash,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  }).eq('id', payment_id);

  // Read current balance then update with optimistic lock
  const { data: plan } = await supabase
    .from('plans')
    .select('credits, total_purchased')
    .eq('user_id', auth.userId)
    .single();

  const currentCredits = plan?.credits ?? 0;
  const totalPurchased = plan?.total_purchased ?? 0;
  const newBalance = currentCredits + payment.credits_added;

  // Optimistic lock: .eq('credits', currentCredits) ensures no concurrent modification
  const { error: creditErr } = await supabase.from('plans').update({
    credits: newBalance,
    total_purchased: totalPurchased + payment.credits_added,
  }).eq('user_id', auth.userId)
    .eq('credits', currentCredits);

  if (creditErr) {
    // Retry once on conflict
    const { data: retryPlan } = await supabase
      .from('plans')
      .select('credits, total_purchased')
      .eq('user_id', auth.userId)
      .single();

    await supabase.from('plans').update({
      credits: (retryPlan?.credits ?? 0) + payment.credits_added,
      total_purchased: (retryPlan?.total_purchased ?? 0) + payment.credits_added,
    }).eq('user_id', auth.userId);
  }

  return NextResponse.json({
    confirmed: true,
    credits_added: payment.credits_added,
    new_balance: newBalance,
    tx_hash,
  });
}
