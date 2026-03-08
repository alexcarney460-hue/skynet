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

  const supabase = createServiceClient();

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
  // In production you'd verify the tx on-chain here
  await supabase.from('payments').update({
    tx_hash,
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
  }).eq('id', payment_id);

  // Add credits to user balance
  const { data: plan } = await supabase
    .from('plans')
    .select('credits, total_purchased')
    .eq('user_id', auth.userId)
    .single();

  const currentCredits = plan?.credits ?? 0;
  const totalPurchased = plan?.total_purchased ?? 0;

  await supabase.from('plans').update({
    credits: currentCredits + payment.credits_added,
    total_purchased: totalPurchased + payment.credits_added,
  }).eq('user_id', auth.userId);

  return NextResponse.json({
    confirmed: true,
    credits_added: payment.credits_added,
    new_balance: currentCredits + payment.credits_added,
    tx_hash,
  });
}
