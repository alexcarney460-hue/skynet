import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

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

  await Promise.all([
    supabase.from('api_keys').insert({ user_id: user.user.id, key_hash: hash, label: 'default' }),
    supabase.from('plans').insert({ user_id: user.user.id, tier: 'free', credits: 100 }),
  ]);

  return NextResponse.json({
    user_id: user.user.id,
    email,
    api_key: raw,
    message: 'Account created. Save your API key — it will not be shown again.',
  });
}
