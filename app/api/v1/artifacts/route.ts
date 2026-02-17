import { NextResponse } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
 * GET /v1/artifacts
 * Public endpoint: returns preview-safe artifact metadata
 * NEVER returns content_text
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('artifacts')
      .select(
        'id, slug, category, title, description, preview_excerpt, price_cents, version, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      status: 'ok',
      data: data || [],
    });
  } catch (err) {
    console.error('GET /v1/artifacts error:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch artifacts' },
      { status: 500 }
    );
  }
}
