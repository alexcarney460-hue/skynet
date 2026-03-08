import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase';
import { authenticateApiKey } from '@/lib/api-auth';

// POST /api/v1/keys — generate a new API key (requires existing key or Supabase session)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const label = (body.label as string) || 'default';

  // Auth: require valid API key — no unauthenticated fallback
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const userId = auth.userId;

  // Generate key
  const raw = `sk_live_${randomBytes(24).toString('hex')}`;
  const hash = createHash('sha256').update(raw).digest('hex');

  const supabase = createServiceClient();
  const { error } = await supabase.from('api_keys').insert({
    user_id: userId,
    key_hash: hash,
    label,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 });
  }

  // Return the raw key ONCE — it's never stored
  return NextResponse.json({
    key: raw,
    label,
    message: 'Save this key — it will not be shown again.',
  });
}

// GET /api/v1/keys — list keys for authenticated user (redacted)
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, label, created_at, last_used_at, revoked_at')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

// DELETE /api/v1/keys — revoke a key
export async function DELETE(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const keyId = body.key_id as string;
  if (!keyId) {
    return NextResponse.json({ error: 'key_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('user_id', auth.userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 });
  }

  return NextResponse.json({ revoked: true });
}
