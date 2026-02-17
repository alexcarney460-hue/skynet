import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /v1/artifacts
 * Public endpoint: returns preview-safe artifact metadata
 * NEVER returns content_text
 */
export async function GET() {
  try {
    // Verify env vars are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

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
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('GET /v1/artifacts error:', errorMsg);
    return NextResponse.json(
      { status: 'error', message: `Failed to fetch artifacts: ${errorMsg}` },
      { status: 500 }
    );
  }
}
