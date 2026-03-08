import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();

  const [{ data: plan }, { data: payments }] = await Promise.all([
    supabase.from('plans').select('credits, total_purchased').eq('user_id', auth.userId).single(),
    supabase.from('payments').select('*').eq('user_id', auth.userId).order('created_at', { ascending: false }).limit(10),
  ]);

  return NextResponse.json({
    credits: plan?.credits ?? 0,
    totalPurchased: plan?.total_purchased ?? 0,
    payments: payments ?? [],
  });
}
