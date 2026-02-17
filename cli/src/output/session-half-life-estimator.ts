/**
 * Session Half-Life Estimator
 * Estimates session stability and remaining useful lifetime.
 * 
 * Heuristic model. Deterministic. Runtime-safe.
 */

export type EstimatedStability = 'STABLE' | 'DECAYING' | 'FRAGILE';
export type DecayRate = 'SLOW' | 'MODERATE' | 'FAST';
export type InterventionUrgency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface SessionHalfLife {
  // Stability assessment
  estimatedStability: EstimatedStability;
  decayRate: DecayRate;
  interventionUrgency: InterventionUrgency;

  // Half-life metrics
  estimatedHalfLifeMinutes: number; // Minutes until session reaches 50% quality
  estimatedRemainingLifeMinutes: number; // Minutes until session unusable
  currentStabilityScore: number; // 0-100, inverse of degradation
  degradationRate: number; // % per minute

  // Decay indicators
  decayVectors: {
    memoryDecay: number; // 0-100, memory pressure trend
    coherenceDecay: number; // 0-100, context drift trend
    tokenDepletionRate: number; // 0-100, token burn acceleration
    cumulativeErrorTendency: number; // 0-100, error/inconsistency trend
  };

  // Intervention signals
  recommendations: {
    shouldSaveCheckpoint: boolean;
    shouldCompress: boolean;
    shouldTerminate: boolean;
    estimatedTimeBeforeCritical: number; // Minutes
  };
}

/**
 * Input metrics for half-life estimation.
 */
export interface HalfLifeInput {
  // Current state
  sessionAgeMinutes: number; // How long session running
  currentMemoryPressurePercent: number; // 0-100
  currentContextDriftPercent: number; // 0-100
  tokenBudgetRemaining: number; // Tokens left
  tokenBudgetTotal: number; // Total tokens

  // Historical trend (if available)
  memoryPressureHistory: number[]; // Last N readings (e.g., every 5 min)
  contextDriftHistory: number[]; // Last N readings
  tokenBurnRateHistory: number[]; // Last N burn rates (t/min)
  errorCountThisSession: number; // Errors encountered

  // Baseline expectations
  expectedSessionLengthMinutes: number; // Normal session duration
  systemMode: 'demo' | 'production' | 'diagnostic';
}

/**
 * Deterministic half-life estimation.
 * Models session degradation as exponential decay.
 * No ML. Pure heuristics.
 */
export function estimateSessionHalfLife(input: HalfLifeInput): SessionHalfLife {
  // Decay vector calculations
  const memoryDecay = calculateMemoryDecay(input);
  const coherenceDecay = calculateCoherenceDecay(input);
  const tokenDepletion = calculateTokenDepletionRate(input);
  const errorTendency = calculateErrorTendency(input);

  // Average decay rate
  const avgDecayRate = (memoryDecay + coherenceDecay + tokenDepletion + errorTendency) / 4;

  // Stability score (inverse of degradation)
  const currentStabilityScore = Math.max(0, 100 - avgDecayRate);

  // Determine stability state based on decay vectors and age
  let estimatedStability: EstimatedStability;
  let decayRate: DecayRate;

  if (currentStabilityScore >= 75) {
    estimatedStability = 'STABLE';
  } else if (currentStabilityScore >= 40) {
    estimatedStability = 'DECAYING';
  } else {
    estimatedStability = 'FRAGILE';
  }

  // Decay rate classification
  if (avgDecayRate <= 15) {
    decayRate = 'SLOW';
  } else if (avgDecayRate <= 35) {
    decayRate = 'MODERATE';
  } else {
    decayRate = 'FAST';
  }

  // Calculate half-life (minutes until 50% quality)
  // Using exponential decay: quality(t) = 100 * e^(-k*t)
  // At half-life: 50 = 100 * e^(-k*t) => t = ln(2) / k
  const decayConstant = avgDecayRate / 100; // Convert percentage to decay constant
  const halfLifeMinutes =
    decayConstant > 0.01
      ? Math.round((Math.log(2) / decayConstant) * 60) // Convert to minutes
      : 999; // Very slow decay

  // Remaining useful life (until quality drops to 20%)
  const remainingLifeMinutes =
    decayConstant > 0.01
      ? Math.round((Math.log(5) / decayConstant) * 60)
      : 999;

  // Intervention urgency
  let interventionUrgency: InterventionUrgency;
  if (estimatedStability === 'FRAGILE' || remainingLifeMinutes < 10) {
    interventionUrgency = 'HIGH';
  } else if (estimatedStability === 'DECAYING' || remainingLifeMinutes < 30) {
    interventionUrgency = 'MEDIUM';
  } else {
    interventionUrgency = 'LOW';
  }

  // Recommendations
  const shouldSaveCheckpoint = estimatedStability === 'DECAYING' || estimatedStability === 'FRAGILE';
  const shouldCompress = estimatedStability === 'DECAYING' && coherenceDecay > 50;
  const shouldTerminate = estimatedStability === 'FRAGILE' || remainingLifeMinutes < 5;
  const timeBeforeCritical = Math.max(0, remainingLifeMinutes - 5);

  return {
    estimatedStability,
    decayRate,
    interventionUrgency,

    estimatedHalfLifeMinutes: halfLifeMinutes,
    estimatedRemainingLifeMinutes: remainingLifeMinutes,
    currentStabilityScore: Math.round(currentStabilityScore),
    degradationRate: Math.round(avgDecayRate),

    decayVectors: {
      memoryDecay: Math.round(memoryDecay),
      coherenceDecay: Math.round(coherenceDecay),
      tokenDepletionRate: Math.round(tokenDepletion),
      cumulativeErrorTendency: Math.round(errorTendency),
    },

    recommendations: {
      shouldSaveCheckpoint,
      shouldCompress,
      shouldTerminate,
      estimatedTimeBeforeCritical: timeBeforeCritical,
    },
  };
}

/**
 * Calculate memory decay trend.
 * Higher pressure = faster decay.
 */
function calculateMemoryDecay(input: HalfLifeInput): number {
  const currentPressure = input.currentMemoryPressurePercent;
  const historyTrend = calculateTrend(input.memoryPressureHistory);

  // Current pressure + trend velocity
  const baseDecay = (currentPressure / 100) * 50; // 0-50 from current pressure
  const trendAccel = Math.max(0, historyTrend * 20); // Acceleration from trend

  return Math.min(100, baseDecay + trendAccel);
}

/**
 * Calculate coherence decay trend.
 * Higher drift = faster decay.
 */
function calculateCoherenceDecay(input: HalfLifeInput): number {
  const currentDrift = input.currentContextDriftPercent;
  const historyTrend = calculateTrend(input.contextDriftHistory);

  const baseDecay = (currentDrift / 100) * 50;
  const trendAccel = Math.max(0, historyTrend * 20);

  return Math.min(100, baseDecay + trendAccel);
}

/**
 * Calculate token depletion rate.
 * Faster burn = faster decay.
 */
function calculateTokenDepletionRate(input: HalfLifeInput): number {
  const tokenPercent = (input.tokenBudgetTotal - input.tokenBudgetRemaining) / input.tokenBudgetTotal;
  const burnTrend = calculateTrend(input.tokenBurnRateHistory);

  // Token budget consumption + burn acceleration
  const baseDecay = (tokenPercent / 100) * 40; // 0-40 from consumption
  const trendAccel = Math.max(0, burnTrend * 20);

  return Math.min(100, baseDecay + trendAccel);
}

/**
 * Calculate error tendency.
 * More errors = faster decay.
 */
function calculateErrorTendency(input: HalfLifeInput): number {
  const errorRate = input.errorCountThisSession / Math.max(1, input.sessionAgeMinutes);

  // Baseline: 1 error per 60 min = 10% decay
  return Math.min(100, errorRate * 10 * 60);
}

/**
 * Calculate trend from historical readings.
 * Positive = increasing | Negative = decreasing.
 * Returns rate of change per measurement.
 */
function calculateTrend(history: number[]): number {
  if (history.length < 2) return 0;

  const recent = history.slice(-Math.min(5, history.length));
  const diffs: number[] = [];

  for (let i = 1; i < recent.length; i++) {
    diffs.push(recent[i] - recent[i - 1]);
  }

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return avgDiff / 10; // Normalize to 0-10 range
}

/**
 * Render stability with ANSI colors.
 */
export function renderStability(halfLife: SessionHalfLife): string {
  const stateColors: Record<EstimatedStability, string> = {
    STABLE: '\x1b[32m', // green
    DECAYING: '\x1b[33m', // yellow
    FRAGILE: '\x1b[31m', // red
  };

  const reset = '\x1b[0m';
  const color = stateColors[halfLife.estimatedStability];

  return `${color}${halfLife.estimatedStability}${reset}`;
}

/**
 * Suggest action for agent.
 */
export function suggestHalfLifeAction(
  halfLife: SessionHalfLife
): 'continue' | 'checkpoint' | 'compress' | 'terminate' {
  if (halfLife.recommendations.shouldTerminate) {
    return 'terminate';
  }
  if (halfLife.recommendations.shouldCompress) {
    return 'compress';
  }
  if (halfLife.recommendations.shouldSaveCheckpoint) {
    return 'checkpoint';
  }
  return 'continue';
}
