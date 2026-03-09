import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { getStripe } from '@/lib/stripe';

// POST /api/v1/subscribe/manage — get Stripe Customer Portal URL
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();

  const { data: plan } = await supabase
    .from('plans')
    .select('stripe_customer_id')
    .eq('user_id', auth.userId)
    .single();

  if (!plan?.stripe_customer_id) {
    return NextResponse.json({ error: 'No subscription found. Subscribe first.' }, { status: 404 });
  }

  const stripe = getStripe();
  const origin = request.headers.get('origin') || request.nextUrl.origin;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: plan.stripe_customer_id,
    return_url: `${origin}/console/billing`,
  });

  return NextResponse.json({ portal_url: portalSession.url });
}
