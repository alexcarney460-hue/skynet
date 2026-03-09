import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { checkIpRateLimit } from '@/lib/rate-limit-ip';

export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per IP per 15 minutes
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkIpRateLimit(ip, 'login', 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { email, password, regenerate_key } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Fetch user's active API keys (metadata only — raw keys are never stored)
  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, label, created_at, last_used_at, revoked_at')
    .eq('user_id', data.user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  // If user requests a new key (forgot old one), generate one
  if (regenerate_key) {
    // Revoke all existing keys
    await supabase
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', data.user.id)
      .is('revoked_at', null);

    // Generate new key
    const raw = `sk_live_${randomBytes(24).toString('hex')}`;
    const hash = createHash('sha256').update(raw).digest('hex');

    await supabase.from('api_keys').insert({
      user_id: data.user.id,
      key_hash: hash,
      label: 'regenerated',
    });

    return NextResponse.json({
      user_id: data.user.id,
      email: data.user.email,
      api_key: raw,
      message: 'New API key generated. All previous keys have been revoked. Save this key — it will not be shown again.',
    });
  }

  return NextResponse.json({
    user_id: data.user.id,
    email: data.user.email,
    keys: keys ?? [],
    message: keys?.length
      ? `${keys.length} active key(s) found. If you lost your key, log in again with regenerate_key: true.`
      : 'No active keys. Log in again with regenerate_key: true to create a new one.',
  });
}
