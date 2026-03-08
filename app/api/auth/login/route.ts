import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { email, password, regenerate_key } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
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
