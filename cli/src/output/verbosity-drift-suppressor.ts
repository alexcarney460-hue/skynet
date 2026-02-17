/**
 * Verbosity Drift Suppressor
 * Detects output verbosity drift and recommends correction policy.
 * 
 * Deterministic. No network introspection. Runtime-optimized.
 */

export type VerbosityState = 'OPTIMAL' | 'DRIFTING' | 'EXCESSIVE';
export type TokenImpact = 'LOW' | 'MODERATE' | 'HIGH';
export type CorrectionPolicy = 'MINIMAL' | 'BALANCED' | 'AGGRESSIVE';

export interface VerbosityDriftAssessment {
  // State
  verbosityState: VerbosityState;
  tokenImpact: TokenImpact;
  correctionPolicy: CorrectionPolicy;

  // Metrics
  avgOutputLengthTokens: number; // Observed average output length
  baselineOutputLengthTokens: number; // Expected baseline
  driftPercentage: number; // (actual - baseline) / baseline * 100
  outputCountThisSession: number; // Number of outputs generated
  cumulativeWastedTokens: number; // Tokens wasted due to excess verbosity

  // Recommendations
  recommendations: {
    truncateOutputAt?: number; // Token limit for next outputs
    reduceDetailLevel: boolean; // Remove explanations, justifications
    skipMetaCommentary: boolean; // Remove "as I mentioned", "furthermore", etc
    usePointForm: boolean; // Switch to bullet points
    suppressIntermediateSteps: boolean; // Skip reasoning steps
    enforceResponseFormat: string; // E.g., "json", "csv", "brief"
  };

  // Action signals
  shouldEnforceLimits: boolean; // Agent should hard-limit output
  shouldAlert: boolean; // Alert if verbosity critical
}

/**
 * Input metrics from agent session.
 */
export interface VerbosityInput {
  // Current session state
  recentOutputLengthsTokens: number[]; // Last N outputs (window of 5-10)
  totalOutputsThisSession: number; // Count of all outputs
  totalTokensGeneratedThisSession: number; // Sum of all output tokens

  // Baseline expectations
  expectedBaselineTokensPerOutput: number; // Normal for this agent type
  systemMode: 'demo' | 'production' | 'diagnostic';
  agentProfile: 'minimal' | 'balanced' | 'aggressive';

  // Context
  sessionAgeSeconds: number;
  tokenBudgetUsed: number;
  tokenBudgetTotal: number;
}

/**
 * Deterministic verbosity drift assessment.
 * Compares observed output length against baseline.
 * No model inspection. Pure metrics.
 */
export function assessVerbosityDrift(input: VerbosityInput): VerbosityDriftAssessment {
  // Calculate average output length from recent outputs
  const recentAvg =
    input.recentOutputLengthsTokens.length > 0
      ? Math.round(
          input.recentOutputLengthsTokens.reduce((a, b) => a + b, 0) /
            input.recentOutputLengthsTokens.length
        )
      : input.expectedBaselineTokensPerOutput;

  // Baseline adjusted by system mode
  const modeMultiplier: Record<string, number> = {
    demo: 0.9, // Slightly more verbose (acceptable)
    production: 1.0, // Standard baseline
    diagnostic: 1.3, // Expects verbose diagnostic output
  };
  const baselineAdjusted = Math.round(
    input.expectedBaselineTokensPerOutput * (modeMultiplier[input.systemMode] || 1.0)
  );

  // Drift calculation
  const driftPercentage =
    baselineAdjusted > 0
      ? Math.round(((recentAvg - baselineAdjusted) / baselineAdjusted) * 100)
      : 0;

  // Calculate wasted tokens (cumulative)
  const expectedTotalTokens = input.expectedBaselineTokensPerOutput * input.totalOutputsThisSession;
  const cumulativeWastedTokens = Math.max(
    0,
    input.totalTokensGeneratedThisSession - expectedTotalTokens
  );

  // Determine verbosity state
  let verbosityState: VerbosityState;
  if (driftPercentage <= 10) {
    verbosityState = 'OPTIMAL';
  } else if (driftPercentage <= 40) {
    verbosityState = 'DRIFTING';
  } else {
    verbosityState = 'EXCESSIVE';
  }

  // Calculate token impact
  const wastedTokensPercent = (cumulativeWastedTokens / input.tokenBudgetTotal) * 100;
  let tokenImpact: TokenImpact;
  if (wastedTokensPercent <= 5) {
    tokenImpact = 'LOW';
  } else if (wastedTokensPercent <= 15) {
    tokenImpact = 'MODERATE';
  } else {
    tokenImpact = 'HIGH';
  }

  // Determine correction policy
  let correctionPolicy: CorrectionPolicy;
  if (verbosityState === 'OPTIMAL') {
    correctionPolicy = 'MINIMAL'; // Light touch
  } else if (verbosityState === 'DRIFTING' && tokenImpact === 'MODERATE') {
    correctionPolicy = 'BALANCED'; // Moderate intervention
  } else {
    correctionPolicy = 'AGGRESSIVE'; // Heavy intervention
  }

  // Generate recommendations
  const recommendations = generateRecommendations(
    verbosityState,
    tokenImpact,
    correctionPolicy,
    recentAvg,
    baselineAdjusted
  );

  // Decision signals
  const shouldEnforceLimits = verbosityState === 'EXCESSIVE' || tokenImpact === 'HIGH';
  const shouldAlert = verbosityState === 'EXCESSIVE' && tokenImpact === 'HIGH';

  return {
    verbosityState,
    tokenImpact,
    correctionPolicy,

    avgOutputLengthTokens: recentAvg,
    baselineOutputLengthTokens: baselineAdjusted,
    driftPercentage,
    outputCountThisSession: input.totalOutputsThisSession,
    cumulativeWastedTokens,

    recommendations,
    shouldEnforceLimits,
    shouldAlert,
  };
}

/**
 * Generate correction recommendations based on state.
 */
function generateRecommendations(
  state: VerbosityState,
  impact: TokenImpact,
  policy: CorrectionPolicy,
  avgLength: number,
  baseline: number
): VerbosityDriftAssessment['recommendations'] {
  const recs: VerbosityDriftAssessment['recommendations'] = {
    reduceDetailLevel: false,
    skipMetaCommentary: false,
    usePointForm: false,
    suppressIntermediateSteps: false,
    enforceResponseFormat: 'default',
  };

  if (policy === 'MINIMAL') {
    // Light touch: only suggest, don't enforce
    recs.skipMetaCommentary = true;
  }

  if (policy === 'BALANCED') {
    // Moderate: suggest multiple tactics
    recs.truncateOutputAt = Math.round(baseline * 1.2);
    recs.skipMetaCommentary = true;
    recs.reduceDetailLevel = true;
  }

  if (policy === 'AGGRESSIVE') {
    // Heavy: enforce strict limits
    recs.truncateOutputAt = baseline;
    recs.skipMetaCommentary = true;
    recs.reduceDetailLevel = true;
    recs.usePointForm = true;
    recs.suppressIntermediateSteps = true;
    recs.enforceResponseFormat = 'json'; // Structural reduction
  }

  return recs;
}

/**
 * Render verbosity state with ANSI colors.
 */
export function renderVerbosityState(assessment: VerbosityDriftAssessment): string {
  const stateColors: Record<VerbosityState, string> = {
    OPTIMAL: '\x1b[32m', // green
    DRIFTING: '\x1b[33m', // yellow
    EXCESSIVE: '\x1b[31m', // red
  };

  const reset = '\x1b[0m';
  const color = stateColors[assessment.verbosityState];

  return `${color}${assessment.verbosityState}${reset}`;
}

/**
 * Suggest action for agent.
 */
export function suggestVerbosityAction(
  assessment: VerbosityDriftAssessment
): 'continue' | 'optimize' | 'enforce' {
  if (assessment.shouldEnforceLimits) {
    return 'enforce';
  }
  if (assessment.verbosityState === 'DRIFTING') {
    return 'optimize';
  }
  return 'continue';
}
