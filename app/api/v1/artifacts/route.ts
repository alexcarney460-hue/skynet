import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendDriftMetric, appendTokenUsage } from '@/lib/telemetry';

const ROUTE_PATH = '/api/v1/artifacts';

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const body = { status: 'error', message: 'Supabase env vars missing' };
      await logTelemetry(request, body, 500, Date.now() - startedAt);
      return NextResponse.json(body, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('artifacts')
      .select('id, slug, category, title, description, preview_excerpt, price_cents, version, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const payload = { status: 'ok', data: data ?? [] };
    await logTelemetry(request, payload, 200, Date.now() - startedAt);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const body = { status: 'error', message: `Failed to fetch artifacts: ${message}` };
    await logTelemetry(request, body, 500, Date.now() - startedAt);
    return NextResponse.json(body, { status: 500 });
  }
}

async function logTelemetry(
  request: NextRequest,
  payload: Record<string, unknown>,
  status: number,
  latencyMs: number
) {
  const agent = request.headers.get('x-agent-id') ?? undefined;
  const sessionId = request.headers.get('x-session-id') ?? undefined;
  const responseBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  const requestBytes = Buffer.byteLength(request.url, 'utf8');
  const approxTokensIn = Math.max(1, Math.round(requestBytes / 4));
  const approxTokensOut = Math.max(1, Math.round(responseBytes / 4));

  await appendTokenUsage({
    route: ROUTE_PATH,
    method: request.method,
    requestBytes,
    responseBytes,
    approxTokensIn,
    approxTokensOut,
    agent,
    sessionId,
    status,
    latencyMs,
  });

  await appendDriftMetric({
    route: ROUTE_PATH,
    method: request.method,
    status,
    latencyMs,
    payload,
  });
}
