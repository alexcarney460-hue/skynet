import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createAuthClient() {
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
 * Get authenticated user from request context.
 * Returns userId or null if not authenticated.
 */
export async function getAuthUser() {
  try {
    const supabase = await createAuthClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('getAuthUser error:', err);
    return null;
  }
}
