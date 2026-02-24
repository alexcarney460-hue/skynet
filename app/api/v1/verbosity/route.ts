import { NextRequest, NextResponse } from 'next/server';
import { appendDriftMetric, appendTokenUsage } from '@/lib/telemetry';

/**
 * GET/POST /api/v1/verbosity
 * Verbosity Drift Suppressor endpoint
 */

const ROUTE_PATH = '/api/v1/verbosity';

function evaluateVerbosity(
  outputs: number[],
  expectedBaseline: number,
  tokenBudgetUsed: number,
  tokenBudgetTotal: number
) {
  const avgOutputLength = outputs.reduce((a, b) => a + b, 0) / outputs.length;
  const driftPercent = ((avgOutputLength - expectedBaseline) / expectedBaseline) * 100;

  let verbosityLevel: 'OPTIMAL' | 'DRIFTING' | 'EXCESSIVE' = 'OPTIMAL';
  if (driftPercent > 30) verbosityLevel = 'EXCESSIVE';
  else if (driftPercent > 15) verbosityLevel = 'DRIFTING';

  const recommendations = [
    verbosityLevel === 'EXCESSIVE' ? 'CRITICAL: Reduce output length immediately' : null,
    verbosityLevel === 'DRIFTING' ? 'Monitor verbosity; trim unnecessary content' : null,
    tokenBudgetUsed / tokenBudgetTotal > 0.8 ? 'Token budget running low; compress aggressively' : null,
  ].filter(Boolean);

  return {
    level: verbosityLevel,
    driftPercent,
    avgOutputLength,
    expectedBaseline,
    recommendations,
  };
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const recentOutputLengthsParam = searchParams.get('recentOutputLengths');
    const outputs = recentOutputLengthsParam
      ? recentOutputLengthsParam.split(',').map((x) => parseInt(x, 10))
      : [150, 160, 170, 165, 180];

    const expectedBaseline = parseInt(searchParams.get('expectedBaseline') || '150', 10);
    const tokenBudgetTotal = parseInt(searchParams.get('tokenBudgetTotal') || '100000', 10);
    const tokenBudgetUsed = parseInt(searchParams.get('tokenBudgetUsed') || '50000', 10);

    if (outputs.some((n) => Number.isNaN(n)) || Number.isNaN(expectedBaseline)) {
      const body = {
        error: 'Invalid parameters. Provide numeric recentOutputLengths and expectedBaseline',
      };
      logTelemetry(request, body, 400, Date.now() - startedAt).catch(() => {});
      return NextResponse.json(body, { status: 400 });
    }

    const assessment = evaluateVerbosity(outputs, expectedBaseline, tokenBudgetUsed, tokenBudgetTotal);
    const payload = {
      timestamp: new Date().toISOString(),
      assessment,
    };
    logTelemetry(request, payload, 200, Date.now() - startedAt).catch(() => {});
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Verbosity drift assessment error:', error);
    const body = {
      error: 'Failed to assess verbosity drift',
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
      recentOutputLengthsTokens = [150, 160, 170, 165, 180],
      expectedBaselineTokensPerOutput = 150,
      tokenBudgetUsed = 50000,
      tokenBudgetTotal = 100000,
    } = body;

    const assessment = evaluateVerbosity(
      recentOutputLengthsTokens,
      expectedBaselineTokensPerOutput,
      tokenBudgetUsed,
      tokenBudgetTotal
    );

    const payload = {
      timestamp: new Date().toISOString(),
      assessment,
    };
    logTelemetry(request, payload, 200, Date.now() - startedAt, body).catch(() => {});
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Verbosity drift assessment error:', error);
    const body = {
      error: 'Failed to assess verbosity drift',
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
