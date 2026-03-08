import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Fetch user's API keys (redacted)
  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, label, created_at, last_used_at, revoked_at')
    .eq('user_id', data.user.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    user_id: data.user.id,
    email: data.user.email,
    keys: keys ?? [],
  });
}
