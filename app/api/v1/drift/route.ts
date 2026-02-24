import { NextRequest, NextResponse } from 'next/server';
import { appendDriftMetric, appendTokenUsage } from '@/lib/telemetry';

/**
 * GET /api/v1/drift
 * Drift Detection Layer endpoint
 */

const ROUTE_PATH = '/api/v1/drift';

function evaluateDrift(
  memoryUsedPercent: number,
  tokenBurnRate: number,
  contextDriftPercent: number,
  sessionAgeMinutes: number
) {
  let driftScore = 0;
  driftScore += (memoryUsedPercent / 100) * 0.4;
  driftScore += Math.min(tokenBurnRate / 50, 1.0) * 0.3;
  driftScore += (contextDriftPercent / 100) * 0.3;

  let driftStatus: 'OPTIMAL' | 'WARNING' | 'AT_RISK' | 'CRITICAL' = 'OPTIMAL';
  if (driftScore > 0.75) driftStatus = 'CRITICAL';
  else if (driftScore > 0.5) driftStatus = 'AT_RISK';
  else if (driftScore > 0.25) driftStatus = 'WARNING';

  const recommendations: string[] = [];
  if (driftScore > 0.75) {
    recommendations.push('CRITICAL: Immediate intervention required');
    recommendations.push('Consider session checkpoint or graceful termination');
  } else if (driftScore > 0.5) {
    recommendations.push('High drift detected; monitor closely');
    recommendations.push('Consider reducing output verbosity');
  } else if (driftScore > 0.25) {
    recommendations.push('Moderate drift; plan for compression');
  }

  return {
    score: parseFloat(driftScore.toFixed(3)),
    status: driftStatus,
    memoryUsedPercent,
    tokenBurnRate,
    contextDriftPercent,
    sessionAgeMinutes,
    recommendations,
  };
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const memoryUsedPercent = parseFloat(searchParams.get('memoryUsedPercent') || '45');
    const tokenBurnRate = parseFloat(searchParams.get('tokenBurnRate') || '35');
    const contextDriftPercent = parseFloat(searchParams.get('contextDriftPercent') || '20');
    const sessionAgeMinutes = parseFloat(searchParams.get('sessionAgeMinutes') || '30');
    const systemMode = (searchParams.get('systemMode') || 'production') as 'demo' | 'production' | 'diagnostic';

    if (
      isNaN(memoryUsedPercent) ||
      isNaN(tokenBurnRate) ||
      isNaN(contextDriftPercent) ||
      isNaN(sessionAgeMinutes)
    ) {
      const body = {
        error: 'Invalid parameters. All numeric params must be numbers.',
        example: '/api/v1/drift?memoryUsedPercent=45&tokenBurnRate=35&contextDriftPercent=20&sessionAgeMinutes=30',
      };
      logTelemetry(request, body, 400, Date.now() - startedAt).catch(() => {});
      return NextResponse.json(body, { status: 400 });
    }

    const drift = evaluateDrift(memoryUsedPercent, tokenBurnRate, contextDriftPercent, sessionAgeMinutes);
    const payload = {
      timestamp: new Date().toISOString(),
      drift,
      metadata: {
        systemMode,
        calculatedAt: new Date().toISOString(),
      },
    };

    logTelemetry(request, payload, 200, Date.now() - startedAt).catch(() => {});
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Drift detection error:', error);
    const body = {
      error: 'Failed to evaluate drift',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    logTelemetry(request, body, 500, Date.now() - startedAt).catch(() => {});
    return NextResponse.json(body, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json();
    const {
      memoryUsedPercent = 45,
      tokenBurnRate = 35,
      contextDriftPercent = 20,
      sessionAgeMinutes = 30,
      systemMode = 'production',
    } = body;

    const drift = evaluateDrift(memoryUsedPercent, tokenBurnRate, contextDriftPercent, sessionAgeMinutes);
    const payload = {
      timestamp: new Date().toISOString(),
      drift,
      metadata: {
        systemMode,
        calculatedAt: new Date().toISOString(),
      },
    };

    logTelemetry(request, payload, 200, Date.now() - startedAt, body).catch(() => {});
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Drift detection error:', error);
    const body = {
      error: 'Failed to evaluate drift',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    logTelemetry(request, body, 500, Date.now() - startedAt).catch(() => {});
    return NextResponse.json(body, { status: 500 });
  }
}

async function logTelemetry(
  request: NextRequest,
  payload: Record<string, unknown>,
  status: number,
  latencyMs: number,
  rawBody?: Record<string, unknown>
) {
  const agent = request.headers.get('x-agent-id') ?? undefined;
  const sessionId = request.headers.get('x-session-id') ?? undefined;
  const requestBytes = rawBody ? Buffer.byteLength(JSON.stringify(rawBody), 'utf8') : Buffer.byteLength(request.url, 'utf8');
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
