import { createHash } from 'crypto';
import { createServiceClient } from './supabase';

export type AuthResult = { userId: string } | { error: string; status: number };

export async function authenticateApiKey(request: Request): Promise<AuthResult> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer sk_')) {
    return { error: 'Missing or invalid API key. Expected: Bearer sk_...', status: 401 };
  }

  const key = header.slice(7); // strip "Bearer "
  const hash = createHash('sha256').update(key).digest('hex');

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('api_keys')
      .select('user_id, revoked_at')
      .eq('key_hash', hash)
      .single();

    if (error || !data || data.revoked_at) {
      return { error: 'Invalid or revoked API key', status: 401 };
    }

    // Update last_used_at (fire-and-forget)
    supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', hash).then();

    return { userId: data.user_id };
  } catch {
    return { error: 'Authentication service unavailable', status: 503 };
  }
}
