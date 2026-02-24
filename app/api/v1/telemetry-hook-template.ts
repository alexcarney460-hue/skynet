import { NextRequest, NextResponse } from 'next/server';
import { appendDriftMetric, appendTokenUsage } from '@/lib/telemetry';

/**
 * GET /api/v1/pressure
 * Context Pressure Regulator endpoint
 * 
 * Accepts query parameters or JSON body with current session state.
 * Returns pressure level + recommendations for agent decision-making.
 */

interface PressureQuery {
  memoryUsedPercent?: string;
  tokenBurnRatePerMin?: string;
  contextDriftPercent?: string;
  sessionAgeSeconds?: string;
  tokenBudgetTotal?: string;
  tokenBudgetUsed?: string;
  contextWindowMaxBytes?: string;
  contextWindowUsedBytes?: string;
  systemMode?: string;
  agentProfile?: string;
}

const ROUTE_PATH = '/api/v1/pressure';

function derivePressureLevel(memoryUsedPercent: number, contextDriftPercent: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (memoryUsedPercent > 80 || contextDriftPercent > 40) {
    return 'CRITICAL';
  }
  if (memoryUsedPercent > 65 || contextDriftPercent > 30) {
    return 'HIGH';
  }
  if (memoryUsedPercent > 50 || contextDriftPercent > 20) {
    return 'MODERATE';
  }
  return 'LOW';
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters with defaults
    const memoryUsedPercent = parseFloat(searchParams.get('memoryUsedPercent') || '45');
    const tokenBurnRatePerMin = parseFloat(searchParams.get('tokenBurnRatePerMin') || '35');
    const contextDriftPercent = parseFloat(searchParams.get('contextDriftPercent') || '20');
    const sessionAgeSeconds = parseFloat(searchParams.get('sessionAgeSeconds') || '600');
    const tokenBudgetTotal = parseFloat(searchParams.get('tokenBudgetTotal') || '100000');
    const tokenBudgetUsed = parseFloat(searchParams.get('tokenBudgetUsed') || '35000');
    const contextWindowMaxBytes = parseFloat(searchParams.get('contextWindowMaxBytes') || '200000');
    const contextWindowUsedBytes = parseFloat(searchParams.get('contextWindowUsedBytes') || '90000');
    const systemMode = (searchParams.get('systemMode') || 'production') as 'demo' | 'production' | 'diagnostic';
    const agentProfile = (searchParams.get('agentProfile') || 'balanced') as 'minimal' | 'balanced' | 'aggressive';

    // Validate ranges
    if (
      isNaN(memoryUsedPercent) ||
      isNaN(tokenBurnRatePerMin) ||
      isNaN(contextDriftPercent) ||
      isNaN(sessionAgeSeconds)
    ) {
      const body = {
        error: 'Invalid parameters. All numeric params must be numbers.',
        example:
          '/api/v1/pressure?memoryUsedPercent=45&tokenBurnRatePerMin=35&contextDriftPercent=20&sessionAgeSeconds=600&tokenBudgetTotal=100000&tokenBudgetUsed=35000',
      };
      const response = NextResponse.json(body, { status: 400 });
      logTelemetry(request, body, 400, Date.now() - startedAt).catch(() => {});
      return response;
    }

    const pressureLevel = derivePressureLevel(memoryUsedPercent, contextDriftPercent);

    const pressure = {
      level: pressureLevel,
      sessionAgeSeconds,
      memoryUsedPercent,
      tokenBurnRatePerMin,
      contextDriftPercent,
      recommendations: [
        pressureLevel === 'CRITICAL' ? 'CRITICAL: Consider checkpointing immediately' : null,
        pressureLevel === 'HIGH' ? 'Monitor drift closely; prepare for compression' : null,
        tokenBurnRatePerMin > 50 ? 'High token burn detected; reduce output verbosity' : null,
      ].filter(Boolean),
    };

    const payload = {
      timestamp: new Date().toISOString(),
      pressure,
      metadata: {
        systemMode,
        agentProfile,
        tokenBudgetTotal,
        tokenBudgetUsed,
        contextWindowMaxBytes,
        contextWindowUsedBytes,
      },
    };

    const latency = Date.now() - startedAt;
    logTelemetry(request, payload, 200, latency).catch(() => {});

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Pressure regulator error:', error);
    const body = {
      error: 'Failed to evaluate pressure',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    const latency = Date.now() - startedAt;
    logTelemetry(request, body, 500, latency).catch(() => {});
    return NextResponse.json(body, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await request.json();

    // Validate required fields
    const {
      memoryUsedPercent = 45,
      tokenBurnRatePerMin = 35,
      contextDriftPercent = 20,
      sessionAgeSeconds = 600,
      tokenBudgetTotal = 100000,
      tokenBudgetUsed = 35000,
      contextWindowMaxBytes = 200000,
      contextWindowUsedBytes = 90000,
      systemMode = 'production',
      agentProfile = 'balanced',
    } = body;

    const pressureLevel = derivePressureLevel(memoryUsedPercent, contextDriftPercent);

    const pressure = {
      level: pressureLevel,
      sessionAgeSeconds,
      memoryUsedPercent,
      tokenBurnRatePerMin,
      contextDriftPercent,
      recommendations: [
        pressureLevel === 'CRITICAL' ? 'CRITICAL: Consider checkpointing immediately' : null,
        pressureLevel === 'HIGH' ? 'Monitor drift closely; prepare for compression' : null,
        tokenBurnRatePerMin > 50 ? 'High token burn detected; reduce output verbosity' : null,
      ].filter(Boolean),
    };

    const payload = {
      timestamp: new Date().toISOString(),
      pressure,
      metadata: {
        systemMode,
        agentProfile,
        tokenBudgetTotal,
        tokenBudgetUsed,
        contextWindowMaxBytes,
        contextWindowUsedBytes,
      },
    };

    const latency = Date.now() - startedAt;
    logTelemetry(request, payload, 200, latency, body).catch(() => {});

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Pressure regulator error:', error);
    const body = {
      error: 'Failed to evaluate pressure',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
    const latency = Date.now() - startedAt;
    logTelemetry(request, body, 500, latency).catch(() => {});
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
  const urlBytes = Buffer.byteLength(request.url, 'utf8');
  const responseBytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
  const requestBytes = rawBody ? Buffer.byteLength(JSON.stringify(rawBody), 'utf8') : urlBytes;
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
