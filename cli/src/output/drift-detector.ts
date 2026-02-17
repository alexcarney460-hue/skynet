/**
 * Drift Detection Layer
 * Deterministically simulates system drift conditions based on current state.
 * No randomness. No API calls. Pure simulation.
 */

export type DriftState = 'OPTIMAL' | 'STABLE' | 'DEGRADED' | 'AT_RISK';

export interface DriftMetrics {
  state: DriftState;
  contextDrift: number; // 0-100, % drift from baseline
  tokenBurnRate: number; // tokens/min simulated
  coherenceScore: number; // 0-100, session coherence
  memoryPressure: number; // 0-100, context window utilization %
  warnings: string[];
}

/**
 * Deterministic drift calculation.
 * Uses current time and system mode to calculate metrics.
 * Inputs:
 * - systemMode: 'demo' | 'production' | 'diagnostic'
 * - sessionAge: seconds since session start
 * - contextUsage: bytes used / total bytes
 */
export function detectDrift(
  systemMode: 'demo' | 'production' | 'diagnostic' = 'production',
  sessionAgeSeconds: number = 0,
  contextUsagePercent: number = 45
): DriftMetrics {
  const now = Date.now();
  const nowSeconds = now / 1000;

  // Deterministic drift acceleration based on system mode
  const modeMultiplier: Record<string, number> = {
    demo: 0.3,        // Slow drift (demo mode is forgiving)
    production: 1.0,  // Normal drift rate
    diagnostic: 1.5,  // Fast drift (intensive diagnostics)
  };

  const modeAccel = modeMultiplier[systemMode] || 1.0;

  // Context drift: increases with session age + context pressure
  // Formula: (sessionAge / 3600) * contextUsage * modeAccel
  // Capped at 100
  const contextDrift = Math.min(
    100,
    (sessionAgeSeconds / 3600) * (contextUsagePercent / 50) * modeAccel * 25
  );

  // Token burn rate: simulated tokens/min based on mode and drift
  // Demo: 10-25 t/min, Production: 20-50 t/min, Diagnostic: 50-120 t/min
  const baseBurnRate: Record<string, number> = {
    demo: 15,
    production: 35,
    diagnostic: 80,
  };
  const tokenBurnRate =
    baseBurnRate[systemMode] + (contextDrift / 100) * 30 + (nowSeconds % 60);

  // Coherence score: decreases as drift increases
  // Formula: 100 - contextDrift - (memoryPressure * 0.3)
  const coherenceScore = Math.max(
    0,
    100 - contextDrift - contextUsagePercent * 0.3
  );

  // Memory pressure: input + drift acceleration
  const memoryPressure = Math.min(100, contextUsagePercent + contextDrift * 0.5);

  // Determine state based on coherence score
  let state: DriftState;
  if (coherenceScore >= 85) {
    state = 'OPTIMAL';
  } else if (coherenceScore >= 70) {
    state = 'STABLE';
  } else if (coherenceScore >= 50) {
    state = 'DEGRADED';
  } else {
    state = 'AT_RISK';
  }

  // Generate contextual warnings
  const warnings: string[] = [];

  if (memoryPressure > 80) {
    warnings.push('MEMORY PRESSURE CRITICAL — context window near saturation');
  } else if (memoryPressure > 65) {
    warnings.push('High memory pressure — consider compression');
  }

  if (contextDrift > 75) {
    warnings.push('DRIFT CONDITIONS DETECTED — session coherence degrading');
  } else if (contextDrift > 50) {
    warnings.push('Elevated drift — optimization recommended');
  }

  if (tokenBurnRate > 80 && systemMode === 'production') {
    warnings.push('Token burn rate elevated — check diagnostic intensity');
  }

  if (state === 'AT_RISK') {
    warnings.push('⚠️  SYSTEM AT RISK — immediate intervention required');
  }

  return {
    state,
    contextDrift: Math.round(contextDrift),
    tokenBurnRate: Math.round(tokenBurnRate * 10) / 10,
    coherenceScore: Math.round(coherenceScore),
    memoryPressure: Math.round(memoryPressure),
    warnings,
  };
}

/**
 * Render drift state with color coding.
 * Uses ANSI codes for terminal display.
 */
export function renderDriftState(metrics: DriftMetrics): string {
  const stateColors: Record<DriftState, string> = {
    OPTIMAL: '\x1b[32m', // green
    STABLE: '\x1b[36m',  // cyan
    DEGRADED: '\x1b[33m', // yellow
    AT_RISK: '\x1b[31m', // red
  };

  const reset = '\x1b[0m';
  const color = stateColors[metrics.state];

  return `${color}${metrics.state}${reset}`;
}

/**
 * Determine if drift warnings should suppress normal operation.
 */
export function shouldWarn(metrics: DriftMetrics): boolean {
  return metrics.state === 'AT_RISK' || metrics.warnings.length > 0;
}
