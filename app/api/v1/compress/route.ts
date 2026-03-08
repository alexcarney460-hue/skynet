import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import { checkAndDecrement } from '@/lib/usage';
import { compressFast, truncateSmart } from '@/lib/compress';

// POST /api/v1/compress — Compress agent context to save tokens
// mode: 'compress' (remove fluff) or 'truncate' (keep most important)
// Costs 1 credit (algorithmic, no LLM)
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const usage = await checkAndDecrement(auth.userId);
  if (!usage.allowed) {
    return NextResponse.json({ error: usage.reason, credits: usage.credits }, { status: 429 });
  }

  const body = await request.json();
  const { messages, mode, target_tokens } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({
      error: 'messages array required. Each message: { role: "user"|"assistant"|"system", content: "..." }',
    }, { status: 400 });
  }

  // Validate message format
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return NextResponse.json({ error: 'Each message must have role and content' }, { status: 400 });
    }
  }

  // Cap input at 200 messages
  if (messages.length > 200) {
    return NextResponse.json({ error: 'Max 200 messages per request' }, { status: 413 });
  }

  let result;
  if (mode === 'truncate') {
    result = truncateSmart(messages, target_tokens);
  } else {
    result = compressFast(messages);
  }

  return NextResponse.json({
    ...result,
    _credits: usage.credits,
    _note: result.savings_percent > 0
      ? `Saved ~${result.original_tokens - result.compressed_tokens} tokens (${result.savings_percent}%)`
      : 'No compression needed — context is already lean.',
  });
}
