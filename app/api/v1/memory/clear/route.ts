import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';

// DELETE /api/v1/memory/clear — Clear session memory (no credit cost)
export async function DELETE(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = request.nextUrl.searchParams;
  const agent_id = params.get('agent_id');
  const session_id = params.get('session_id');

  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  let query = supabase
    .from('session_memory')
    .delete()
    .eq('user_id', auth.userId)
    .eq('agent_id', agent_id);

  if (session_id) {
    query = query.eq('session_id', session_id);
  }

  const { error, count } = await query.select('id');

  if (error) {
    return NextResponse.json({ error: 'Failed to clear memory' }, { status: 500 });
  }

  return NextResponse.json({
    cleared: true,
    agent_id,
    session_id: session_id || 'all',
  });
}
