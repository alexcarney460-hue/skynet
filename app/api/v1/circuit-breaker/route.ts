import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';
import {
  evaluateDrift, evaluatePressure, evaluateVerbosity, evaluateHalfLife,
  DriftInput, PressureInput, VerbosityInput, HalfLifeInput,
} from '@/lib/metrics';

// Default thresholds — agents can override
const DEFAULT_THRESHOLDS = {
  driftScore: 0.7,
  pressureLevel: 'HIGH' as const,
  verbosityDriftPercent: 30,
  halfLifeMinutes: 10,
  maxCostUsd: null as number | null,
};

interface CircuitInput {
  drift?: DriftInput;
  pressure?: PressureInput;
  verbosity?: VerbosityInput;
  halfLife?: HalfLifeInput;
  thresholds?: Partial<typeof DEFAULT_THRESHOLDS>;
  // Cost tracking
  cost_per_token?: number;
  total_tokens?: number;
}

const PRESSURE_ORDER = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

// POST /api/v1/circuit-breaker — Evaluate whether agent should halt
export async function POST(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Circuit breaker is FREE — no credit cost (it saves money)
  let body: CircuitInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const thresholds = { ...DEFAULT_THRESHOLDS, ...body.thresholds };

  const signals: Record<string, { value: number | string; threshold: number | string; tripped: boolean }> = {};
  let halt = false;
  const reasons: string[] = [];

  // Evaluate drift
  if (body.drift) {
    const result = evaluateDrift(body.drift);
    const tripped = result.score > thresholds.driftScore;
    signals.drift = { value: result.score, threshold: thresholds.driftScore, tripped };
    if (tripped) {
      halt = true;
      reasons.push(`Drift score ${result.score} exceeds ${thresholds.driftScore} — ${result.status}`);
    }
  }

  // Evaluate pressure
  if (body.pressure) {
    const result = evaluatePressure(body.pressure);
    const tripped = PRESSURE_ORDER.indexOf(result.level) >= PRESSURE_ORDER.indexOf(thresholds.pressureLevel);
    signals.pressure = { value: result.level, threshold: thresholds.pressureLevel, tripped };
    if (tripped) {
      halt = true;
      reasons.push(`Pressure level ${result.level} at or above ${thresholds.pressureLevel}`);
    }
  }

  // Evaluate verbosity
  if (body.verbosity) {
    const result = evaluateVerbosity(body.verbosity);
    const tripped = result.driftPercent > thresholds.verbosityDriftPercent;
    signals.verbosity = { value: result.driftPercent, threshold: thresholds.verbosityDriftPercent, tripped };
    if (tripped) {
      halt = true;
      reasons.push(`Verbosity drift ${result.driftPercent}% exceeds ${thresholds.verbosityDriftPercent}% — ${result.level}`);
    }
  }

  // Evaluate half-life
  if (body.halfLife) {
    const result = evaluateHalfLife(body.halfLife);
    const tripped = result.estimatedHalfLifeMinutes < thresholds.halfLifeMinutes;
    signals.halfLife = { value: result.estimatedHalfLifeMinutes, threshold: thresholds.halfLifeMinutes, tripped };
    if (tripped) {
      halt = true;
      reasons.push(`Half-life ${result.estimatedHalfLifeMinutes}min below ${thresholds.halfLifeMinutes}min — ${result.stability}`);
    }
  }

  // Cost check
  if (thresholds.maxCostUsd && body.cost_per_token && body.total_tokens) {
    const estimatedCost = body.cost_per_token * body.total_tokens;
    const tripped = estimatedCost > thresholds.maxCostUsd;
    signals.cost = { value: estimatedCost, threshold: thresholds.maxCostUsd, tripped };
    if (tripped) {
      halt = true;
      reasons.push(`Estimated cost $${estimatedCost.toFixed(4)} exceeds max $${thresholds.maxCostUsd}`);
    }
  }

  const severity = reasons.length === 0 ? 'nominal' :
    reasons.length === 1 ? 'warning' : 'critical';

  return NextResponse.json({
    halt,
    severity,
    signals,
    reasons,
    recommendation: halt
      ? 'HALT: Agent should stop current execution loop and checkpoint state.'
      : 'CONTINUE: All signals within acceptable range.',
    timestamp: new Date().toISOString(),
  });
}
