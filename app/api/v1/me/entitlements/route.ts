import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserEntitlements } from '@/lib/entitlements';
import { appendDriftMetric, appendTokenUsage } from '@/lib/telemetry';

const ROUTE_PATH = '/api/v1/me/entitlements';

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const body = { status: 'error', message: 'Unauthorized' };
      await logTelemetry(request, body, 401, Date.now() - startedAt);
      return NextResponse.json(body, { status: 401 });
    }

    const token = authHeader.slice(7);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase env vars missing');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const body = { status: 'error', message: 'Unauthorized' };
      await logTelemetry(request, body, 401, Date.now() - startedAt);
      return NextResponse.json(body, { status: 401 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const entitlements = await getUserEntitlements(user.id, adminClient);
    const payload = {
      status: 'ok',
      data: {
        user_id: user.id,
        full_unlock: entitlements.hasFullUnlock,
        unlocked_artifacts: entitlements.unlockedArtifactIds,
      },
    };

    await logTelemetry(request, payload, 200, Date.now() - startedAt);
    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const body = { status: 'error', message: `Failed to fetch entitlements: ${message}` };
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
  const requestBytes = Buffer.byteLength(request.url, 'utf8');
  const responseBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
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
