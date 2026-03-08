import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { checkAndDecrement } from '@/lib/usage';

// GET /api/v1/memory/retrieve?agent_id=xxx&session_id=yyy
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const usage = await checkAndDecrement(auth.userId);
  if (!usage.allowed) {
    return NextResponse.json({ error: usage.reason, credits: usage.credits }, { status: 429 });
  }

  const params = request.nextUrl.searchParams;
  const agent_id = params.get('agent_id');
  const session_id = params.get('session_id');

  if (!agent_id) {
    return NextResponse.json({ error: 'agent_id required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // If session_id provided, get specific session; otherwise list all for agent
  if (session_id) {
    const { data, error } = await supabase
      .from('session_memory')
      .select('agent_id, session_id, data, metadata, token_count, updated_at, expires_at')
      .eq('user_id', auth.userId)
      .eq('agent_id', agent_id)
      .eq('session_id', session_id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ ...data, _credits: usage.credits });
  }

  // List all sessions for this agent
  const { data, error } = await supabase
    .from('session_memory')
    .select('session_id, token_count, updated_at, expires_at')
    .eq('user_id', auth.userId)
    .eq('agent_id', agent_id)
    .gt('expires_at', new Date().toISOString())
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: 'Failed to retrieve sessions' }, { status: 500 });
  }

  return NextResponse.json({
    agent_id,
    sessions: data ?? [],
    count: data?.length ?? 0,
    _credits: usage.credits,
  });
}
