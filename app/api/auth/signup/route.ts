import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { checkIpRateLimit } from '@/lib/rate-limit-ip';

export async function POST(request: NextRequest) {
  // Rate limit: 5 signups per IP per hour
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkIpRateLimit(ip, 'signup', 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { email, password } = body;

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email and password (6+ chars) required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Create user via admin API
  const { data: user, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 400 });
  }

  // Create profile
  await supabase.from('profiles').insert({
    id: user.user.id,
    display_name: email.split('@')[0],
  });

  // Auto-generate first API key
  const raw = `sk_live_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');

  const [keyResult, planResult] = await Promise.all([
    supabase.from('api_keys').insert({ user_id: user.user.id, key_hash: hash, label: 'default' }),
    supabase.from('plans').insert({ user_id: user.user.id, tier: 'free', credits: 100 }),
  ]);

  if (keyResult.error || planResult.error) {
    return NextResponse.json({
      error: 'Account created but setup incomplete. Please contact support.',
    }, { status: 500 });
  }

  return NextResponse.json({
    user_id: user.user.id,
    email,
    api_key: raw,
    message: 'Account created. Save your API key — it will not be shown again.',
  });
}
