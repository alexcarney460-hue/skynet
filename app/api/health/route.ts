import { NextRequest, NextResponse } from 'next/server';
import { extractAgentSession, getOrCreateRequestId, logPhase2Metric } from '@/lib/phase2-metrics';

/**
 * GET /api/health
 * Simple health check endpoint (no dependencies)
 */
export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const requestId = getOrCreateRequestId(request);
  const { agentId, sessionId } = extractAgentSession(request);

  await logPhase2Metric({
    v: 1,
    ts: new Date().toISOString(),
    kind: 'gate',
    requestId,
    route: '/api/health',
    method: 'GET',
    status: 200,
    latencyMs: Date.now() - t0,
    agentId,
    sessionId,
  });

  return NextResponse.json({
    status: 'ok',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    requestId,
  });
}
