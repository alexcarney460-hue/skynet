import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserEntitlements } from '@/lib/entitlements';

/**
 * GET /v1/me/entitlements
 * Auth required (Bearer token in Authorization header).
 * Returns: { full_unlock, unlocked_artifacts: UUID[] }
 * Source of truth for client/agent entitlements.
 */
export async function GET(request: Request) {
  try {
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    
    // Verify env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get entitlements (use service role to bypass RLS)
    const publicSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const entitlements = await getUserEntitlements(user.id, publicSupabase);

    return NextResponse.json({
      status: 'ok',
      data: {
        user_id: user.id,
        full_unlock: entitlements.hasFullUnlock,
        unlocked_artifacts: entitlements.unlockedArtifactIds,
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('GET /v1/me/entitlements error:', errorMsg);
    return NextResponse.json(
      { status: 'error', message: `Failed to fetch entitlements: ${errorMsg}` },
      { status: 500 }
    );
  }
}
