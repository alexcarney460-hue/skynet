import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { userOwnsArtifact } from '@/lib/entitlements';

/**
 * GET /v1/artifacts/[slug]
 * Public preview OR authenticated full content
 * If entitled: return full artifact with content_text
 * If not entitled: return preview-safe fields only
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch artifact (preview fields always available)
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (artifactError || !artifact) {
      return NextResponse.json(
        { status: 'error', message: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Try to get user from auth header (Bearer token)
    const authHeader = _request.headers.get('authorization');
    let entitled = false;
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        // Create authenticated client with user token
        const authSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: `Bearer ${token}` } } }
        );
        
        const { data: { user } } = await authSupabase.auth.getUser();
        if (user) {
          userId = user.id;
          entitled = await userOwnsArtifact(user.id, artifact.id, supabase);
        }
      } catch {
        // Token invalid, continue as unauthenticated
      }
    }

    // Return response based on entitlement
    if (entitled) {
      // Full artifact with content
      return NextResponse.json({
        status: 'ok',
        data: artifact,
        entitled: true,
      });
    } else {
      // Preview-safe response only
      const preview = {
        id: artifact.id,
        slug: artifact.slug,
        category: artifact.category,
        title: artifact.title,
        description: artifact.description,
        preview_excerpt: artifact.preview_excerpt,
        price_cents: artifact.price_cents,
        version: artifact.version,
        created_at: artifact.created_at,
      };

      return NextResponse.json({
        status: 'ok',
        data: preview,
        entitled: false,
      });
    }
  } catch (err) {
    console.error('GET /v1/artifacts/[slug] error:', err);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch artifact' },
      { status: 500 }
    );
  }
}
