import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { createServiceClient } from '@/lib/supabase';
import { checkAndDecrement } from '@/lib/usage';

// POST /api/v1/memory/store — Save agent session state
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { agent_id, session_id, data, metadata } = body;

  if (!agent_id || !session_id || !data) {
    return NextResponse.json({ error: 'agent_id, session_id, and data required' }, { status: 400 });
  }

  // Estimate token count from JSON size (~4 chars per token)
  const jsonStr = JSON.stringify(data);
  const estimatedTokens = Math.ceil(jsonStr.length / 4);

  // Cap at 500KB per entry
  if (jsonStr.length > 512_000) {
    return NextResponse.json({ error: 'Data too large. Max 500KB per session.' }, { status: 413 });
  }

  // Deduct credit AFTER validation passes
  const usage = await checkAndDecrement(auth.userId);
  if (!usage.allowed) {
    return NextResponse.json({ error: usage.reason, credits: usage.credits }, { status: 429 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from('session_memory').upsert({
    user_id: auth.userId,
    agent_id,
    session_id,
    data,
    metadata: metadata || {},
    token_count: estimatedTokens,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }, {
    onConflict: 'user_id,agent_id,session_id',
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to store memory' }, { status: 500 });
  }

  return NextResponse.json({
    stored: true,
    agent_id,
    session_id,
    token_count: estimatedTokens,
    bytes: jsonStr.length,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    _credits: usage.credits,
  });
}
