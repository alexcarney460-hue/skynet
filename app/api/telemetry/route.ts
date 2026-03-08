import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10),
    200,
  );

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('telemetry_events')
    .select('*')
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }

  return NextResponse.json({ events: data, count: data.length });
}
