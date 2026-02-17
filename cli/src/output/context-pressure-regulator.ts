/**
 * Context Pressure Regulator
 * Derived stability metric representing session survivability & token risk.
 * Callable by agents for runtime decision-making.
 * 
 * Deterministic heuristics only. No ML. No fake claims.
 */

export type PressureLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface ContextPressure {
  // Pressure level derived from metrics
  level: PressureLevel;

  // Supporting metrics (0-100 scales)
  memoryPressure: number; // Context window utilization
  tokenBurnRate: number; // Tokens per minute (normalized 0-100 scale)
  contextDrift: number; // Session coherence degradation
  sessionViability: number; // Overall survivability score (inverse pressure)

  // Token accounting
  estimatedTokensRemaining: number; // Projected tokens until saturation
  estimatedMinutesRemaining: number; // At current burn rate
  burnRateAcceleration: number; // Multiplier indicating if burning faster

  // Runtime decision support
  recommendations: {
    shouldCompress: boolean; // Recommend session compression
    shouldOptimize: boolean; // Recommend parameter optimization
    shouldTerminate: boolean; // Recommend graceful termination
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };

  // Thresholds crossed
  thresholdsExceeded: string[];
}

/**
 * Pressure evaluation model.
 * Inputs represent real runtime state.
 */
export interface PressureInput {
  // Current state
  memoryUsedPercent: number; // 0-100, context window used
  tokenBurnRatePerMin: number; // Actual observed or simulated
  contextDriftPercent: number; // 0-100, from drift detector
  sessionAgeSeconds: number; // How long session running

  // Capacity
  tokenBudgetTotal: number; // Total tokens available for session
  tokenBudgetUsed: number; // Tokens consumed so far
  contextWindowMaxBytes: number; // Total context window size
  contextWindowUsedBytes: number; // Bytes currently used

  // Mode
  systemMode: 'demo' | 'production' | 'diagnostic';
  agentProfile?: 'minimal' | 'balanced' | 'aggressive'; // Agent optimization profile
}

/**
 * Deterministic context pressure evaluation.
 * No randomness. Same inputs = same outputs.
 * 
 * Pressure is derived from survivability equation:
 * sessionViability = min(100, 
 *   (1 - memoryNorm) * 40 +           // Memory availability (40% weight)
 *   (1 - tokenBurnNorm) * 40 +        // Token efficiency (40% weight)
 *   (1 - driftNorm) * 20              // Coherence (20% weight)
 * )
 * 
 * Level = sessionViability >= 75 ? LOW
 *       : sessionViability >= 50 ? MODERATE
 *       : sessionViability >= 25 ? HIGH
 *       : CRITICAL
 */
export function evaluateContextPressure(input: PressureInput): ContextPressure {
  // Normalize metrics to 0-1 scale
  const memoryNorm = input.memoryUsedPercent / 100;
  const tokensUsedNorm = input.tokenBudgetUsed / input.tokenBudgetTotal;
  const driftNorm = input.contextDriftPercent / 100;

  // Token burn rate normalization (0-100 tokens/min = baseline)
  // >100 t/min is severe
  const tokenBurnNorm = Math.min(1, input.tokenBurnRatePerMin / 100);

  // Session viability: weighted inverse of pressures
  const sessionViability = Math.max(
    0,
    (1 - memoryNorm) * 40 + (1 - tokenBurnNorm) * 40 + (1 - driftNorm) * 20
  );

  // Determine pressure level
  let level: PressureLevel;
  if (sessionViability >= 75) {
    level = 'LOW';
  } else if (sessionViability >= 50) {
    level = 'MODERATE';
  } else if (sessionViability >= 25) {
    level = 'HIGH';
  } else {
    level = 'CRITICAL';
  }

  // Token accounting
  const tokensRemaining = input.tokenBudgetTotal - input.tokenBudgetUsed;
  const minutesRemaining = Math.max(
    0,
    input.tokenBurnRatePerMin > 0 ? tokensRemaining / input.tokenBurnRatePerMin : 999
  );

  // Burn rate acceleration (normalized to 0-100)
  // Baseline is 35 t/min for production
  const baselineBurnRate = input.systemMode === 'demo' ? 15 : input.systemMode === 'diagnostic' ? 80 : 35;
  const burnRateAcceleration = input.tokenBurnRatePerMin / baselineBurnRate;

  // Recommendations engine
  const shouldCompress =
    level === 'HIGH' ||
    level === 'CRITICAL' ||
    input.memoryUsedPercent > 70;

  const shouldOptimize =
    level === 'MODERATE' ||
    level === 'HIGH' ||
    input.tokenBurnRatePerMin > baselineBurnRate * 1.5;

  const shouldTerminate =
    level === 'CRITICAL' ||
    input.memoryUsedPercent > 95 ||
    minutesRemaining < 5;

  // Determine recommendation priority
  let priority: 'low' | 'normal' | 'high' | 'urgent' = 'low';
  if (level === 'CRITICAL') {
    priority = 'urgent';
  } else if (level === 'HIGH') {
    priority = 'high';
  } else if (level === 'MODERATE') {
    priority = 'normal';
  }

  // Thresholds exceeded
  const thresholdsExceeded: string[] = [];
  if (input.memoryUsedPercent > 80)
    thresholdsExceeded.push('memory_critical');
  if (input.memoryUsedPercent > 65)
    thresholdsExceeded.push('memory_warning');
  if (tokensRemaining < input.tokenBudgetTotal * 0.1)
    thresholdsExceeded.push('token_budget_10_percent');
  if (tokensRemaining < input.tokenBudgetTotal * 0.05)
    thresholdsExceeded.push('token_budget_5_percent');
  if (input.contextDriftPercent > 75)
    thresholdsExceeded.push('drift_critical');
  if (input.sessionAgeSeconds > 7200)
    thresholdsExceeded.push('session_too_long');
  if (minutesRemaining < 10)
    thresholdsExceeded.push('eol_approaching');

  return {
    level,
    memoryPressure: Math.round(input.memoryUsedPercent),
    tokenBurnRate: Math.round(Math.min(100, tokenBurnNorm * 100)),
    contextDrift: Math.round(input.contextDriftPercent),
    sessionViability: Math.round(sessionViability),

    estimatedTokensRemaining: Math.round(tokensRemaining),
    estimatedMinutesRemaining: Math.round(minutesRemaining * 10) / 10,
    burnRateAcceleration: Math.round(burnRateAcceleration * 100) / 100,

    recommendations: {
      shouldCompress,
      shouldOptimize,
      shouldTerminate,
      priority,
    },

    thresholdsExceeded,
  };
}

/**
 * Render pressure level with ANSI colors.
 */
export function renderPressureLevel(pressure: ContextPressure): string {
  const levelColors: Record<PressureLevel, string> = {
    LOW: '\x1b[32m', // green
    MODERATE: '\x1b[36m', // cyan
    HIGH: '\x1b[33m', // yellow
    CRITICAL: '\x1b[31m', // red
  };

  const reset = '\x1b[0m';
  const color = levelColors[pressure.level];

  return `${color}${pressure.level}${reset}`;
}

/**
 * Determine if pressure level requires immediate action.
 */
export function requiresImmediateAction(pressure: ContextPressure): boolean {
  return (
    pressure.level === 'CRITICAL' ||
    pressure.recommendations.shouldTerminate ||
    pressure.estimatedMinutesRemaining < 5
  );
}

/**
 * Suggested agent action based on pressure level.
 * For decision trees in agent code.
 */
export function suggestAgentAction(
  pressure: ContextPressure
): 'continue' | 'optimize' | 'compress' | 'terminate' {
  if (pressure.recommendations.shouldTerminate) {
    return 'terminate';
  }
  if (pressure.recommendations.shouldCompress && pressure.level === 'HIGH') {
    return 'compress';
  }
  if (pressure.recommendations.shouldOptimize) {
    return 'optimize';
  }
  return 'continue';
}
