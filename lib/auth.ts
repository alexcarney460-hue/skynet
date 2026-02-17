import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase client for server-side operations.
 * Use Bearer token from Authorization header for authenticated requests.
 */
export function createAuthClient(token?: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (token) {
    // Return client with token in headers for authenticated operations
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { 
        global: { 
          headers: { Authorization: `Bearer ${token}` } 
        } 
      }
    );
  }

  return client;
}

/**
 * Get authenticated user from Bearer token.
 * Token should be passed from Authorization header.
 */
export async function getAuthUser(token: string) {
  try {
    const supabase = createAuthClient(token);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('getAuthUser error:', err);
    return null;
  }
}
