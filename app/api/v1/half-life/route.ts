import { NextRequest, NextResponse } from 'next/server';
import { extractAgentSession, getOrCreateRequestId, logPhase2Metric } from '@/lib/phase2-metrics';

/**
 * GET/POST /api/v1/half-life
 * Session Half-Life Estimator endpoint
 *
 * Estimates session stability and remaining useful lifetime.
 */

export async function GET(request: NextRequest) {
  const t0 = Date.now();
  const requestId = getOrCreateRequestId(request);
  const { agentId, sessionId } = extractAgentSession(request);

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse parameters
    const sessionAgeMinutes = parseInt(searchParams.get('sessionAge') || '30', 10);
    const memoryPressure = parseInt(searchParams.get('memoryPressure') || '45', 10);
    const contextDrift = parseInt(searchParams.get('contextDrift') || '25', 10);
    const tokenRemaining = parseInt(searchParams.get('tokenRemaining') || '50000', 10);
    const tokenTotal = parseInt(searchParams.get('tokenTotal') || '100000', 10);
    const expectedLength = parseInt(searchParams.get('expectedLength') || '120', 10);
    const errorCount = parseInt(searchParams.get('errors') || '0', 10);
    const systemMode = (searchParams.get('systemMode') || 'production') as 'demo' | 'production' | 'diagnostic';

    // Inline half-life estimation (no CLI dependency)
    const tokenBurnRate = (tokenTotal - tokenRemaining) / Math.max(sessionAgeMinutes, 1);
    const minutesUntilTokenExhaustion = tokenRemaining / Math.max(tokenBurnRate, 1);
    const decayRate = (memoryPressure + contextDrift) / 100;
    const estimatedHalfLifeMinutes = minutesUntilTokenExhaustion / (1 + decayRate);

    let stability = 'STABLE';
    if (estimatedHalfLifeMinutes < 10) {
      stability = 'FRAGILE';
    } else if (estimatedHalfLifeMinutes < 30) {
      stability = 'DECAYING';
    }

    const halfLife = {
      estimatedHalfLifeMinutes: Math.round(estimatedHalfLifeMinutes),
      stability,
      sessionAgeMinutes,
      tokenBurnRatePerMin: Math.round(tokenBurnRate * 10) / 10,
      minutesUntilExhaustion: Math.round(minutesUntilTokenExhaustion),
      recommendations: [
        stability === 'FRAGILE' ? 'URGENT: Session ending soon; checkpoint immediately' : null,
        stability === 'DECAYING' ? 'Stability declining; prepare for graceful shutdown' : null,
        errorCount > 3 ? 'Multiple errors detected; consider restart' : null,
      ].filter(Boolean),
    };

    await logPhase2Metric({
      v: 1,
      ts: new Date().toISOString(),
      kind: 'gate',
      requestId,
      route: '/api/v1/half-life',
      method: 'GET',
      status: 200,
      latencyMs: Date.now() - t0,
      agentId,
      sessionId,
      memoryUsedPercent: memoryPressure,
      contextDriftPercent: contextDrift,
      sessionAgeSeconds: sessionAgeMinutes * 60,
      tokenBurnRatePerMin: Math.round(tokenBurnRate * 10) / 10,
      halfLifeMinutesEstimated: Math.round(estimatedHalfLifeMinutes),
      systemMode,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      halfLife,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Half-life estimation error:', error);

    await logPhase2Metric({
      v: 1,
      ts: new Date().toISOString(),
      kind: 'error',
      requestId,
      route: '/api/v1/half-life',
      method: 'GET',
      status: 500,
      latencyMs: Date.now() - t0,
      agentId,
      sessionId,
      error: { message: error instanceof Error ? error.message : 'Unknown error', name: error instanceof Error ? error.name : undefined },
    });

    return NextResponse.json(
      {
        error: 'Failed to estimate session half-life',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const requestId = getOrCreateRequestId(request);
  const { agentId, sessionId } = extractAgentSession(request);

  try {
    const body = await request.json();

    const {
      sessionAgeMinutes = 30,
      currentMemoryPressurePercent = 45,
      currentContextDriftPercent = 25,
      tokenBudgetRemaining = 50000,
      tokenBudgetTotal = 100000,
      memoryPressureHistory = [40, 42, 44, 46, 48],
      contextDriftHistory = [20, 21, 23, 25, 26],
      tokenBurnRateHistory = [30, 32, 34, 35, 36],
      errorCountThisSession = 0,
      expectedSessionLengthMinutes = 120,
      systemMode = 'production',
    } = body;

    // Inline half-life estimation (no CLI dependency)
    const tokenBurnRate = (tokenBudgetTotal - tokenBudgetRemaining) / Math.max(sessionAgeMinutes, 1);
    const minutesUntilTokenExhaustion = tokenBudgetRemaining / Math.max(tokenBurnRate, 1);
    const decayRate = (currentMemoryPressurePercent + currentContextDriftPercent) / 100;
    const estimatedHalfLifeMinutes = minutesUntilTokenExhaustion / (1 + decayRate);

    let stability = 'STABLE';
    if (estimatedHalfLifeMinutes < 10) {
      stability = 'FRAGILE';
    } else if (estimatedHalfLifeMinutes < 30) {
      stability = 'DECAYING';
    }

    const halfLife = {
      estimatedHalfLifeMinutes: Math.round(estimatedHalfLifeMinutes),
      stability,
      sessionAgeMinutes,
      tokenBurnRatePerMin: Math.round(tokenBurnRate * 10) / 10,
      minutesUntilExhaustion: Math.round(minutesUntilTokenExhaustion),
      recommendations: [
        stability === 'FRAGILE' ? 'URGENT: Session ending soon; checkpoint immediately' : null,
        stability === 'DECAYING' ? 'Stability declining; prepare for graceful shutdown' : null,
        errorCountThisSession > 3 ? 'Multiple errors detected; consider restart' : null,
      ].filter(Boolean),
    };

    await logPhase2Metric({
      v: 1,
      ts: new Date().toISOString(),
      kind: 'gate',
      requestId,
      route: '/api/v1/half-life',
      method: 'POST',
      status: 200,
      latencyMs: Date.now() - t0,
      agentId,
      sessionId,
      memoryUsedPercent: currentMemoryPressurePercent,
      contextDriftPercent: currentContextDriftPercent,
      sessionAgeSeconds: sessionAgeMinutes * 60,
      tokenBurnRatePerMin: Math.round(tokenBurnRate * 10) / 10,
      halfLifeMinutesEstimated: Math.round(estimatedHalfLifeMinutes),
      systemMode,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      halfLife,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Half-life estimation error:', error);

    await logPhase2Metric({
      v: 1,
      ts: new Date().toISOString(),
      kind: 'error',
      requestId,
      route: '/api/v1/half-life',
      method: 'POST',
      status: 500,
      latencyMs: Date.now() - t0,
      agentId,
      sessionId,
      error: { message: error instanceof Error ? error.message : 'Unknown error', name: error instanceof Error ? error.name : undefined },
    });

    return NextResponse.json(
      {
        error: 'Failed to estimate session half-life',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
