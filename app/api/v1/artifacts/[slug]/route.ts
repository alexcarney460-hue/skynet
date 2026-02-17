import { NextResponse } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { userOwnsArtifact } from '@/lib/entitlements';

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
    const supabase = await createClient();

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

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    let entitled = false;

    if (user) {
      entitled = await userOwnsArtifact(user.id, artifact.id, supabase);
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
