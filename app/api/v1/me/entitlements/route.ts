import { NextResponse } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserEntitlements } from '@/lib/entitlements';

async function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}

/**
 * GET /v1/me/entitlements
 * Auth required.
 * Returns: { full_unlock, unlocked_artifacts: UUID[] }
 * Source of truth for client/agent entitlements.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Extract user from auth context
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get entitlements
    const entitlements = await getUserEntitlements(user.id, supabase);

    return NextResponse.json({
      status: 'ok',
      data: {
        user_id: user.id,
        full_unlock: entitlements.hasFullUnlock,
        unlocked_artifacts: entitlements.unlockedArtifactIds,
      },
    });
  } catch (err) {
    console.error('GET /v1/me/entitlements error:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
