// SkynetX -- Pure calculation engines for all 4 metric endpoints

// -- Drift ------------------------------------------------------------------

export interface DriftInput {
  memoryUsedPercent: number;
  tokenBurnRate: number;
  contextDriftPercent: number;
  sessionAgeMinutes: number;
}

export interface DriftResult {
  score: number;
  status: 'OPTIMAL' | 'WARNING' | 'AT_RISK' | 'CRITICAL';
  memoryUsedPercent: number;
  tokenBurnRate: number;
  contextDriftPercent: number;
  sessionAgeMinutes: number;
  recommendations: string[];
}

export function evaluateDrift(input: DriftInput): DriftResult {
  const { memoryUsedPercent, tokenBurnRate, contextDriftPercent, sessionAgeMinutes } = input;

  let driftScore = 0;
  driftScore += (memoryUsedPercent / 100) * 0.4;
  driftScore += Math.min(tokenBurnRate / 50, 1.0) * 0.3;
  driftScore += (contextDriftPercent / 100) * 0.3;

  let status: DriftResult['status'] = 'OPTIMAL';
  if (driftScore > 0.75) status = 'CRITICAL';
  else if (driftScore > 0.5) status = 'AT_RISK';
  else if (driftScore > 0.25) status = 'WARNING';

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
    status,
    memoryUsedPercent,
    tokenBurnRate,
    contextDriftPercent,
    sessionAgeMinutes,
    recommendations,
  };
}

// -- Pressure ---------------------------------------------------------------

export interface PressureInput {
  memoryUsedPercent: number;
  tokenBurnRatePerMin: number;
  contextDriftPercent: number;
  sessionAgeSeconds: number;
  tokenBudgetTotal: number;
  tokenBudgetUsed: number;
}

export interface PressureResult {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  sessionAgeSeconds: number;
  memoryUsedPercent: number;
  tokenBurnRatePerMin: number;
  contextDriftPercent: number;
  recommendations: string[];
}

export function evaluatePressure(input: PressureInput): PressureResult {
  const { memoryUsedPercent, tokenBurnRatePerMin, contextDriftPercent, sessionAgeSeconds } = input;

  let level: PressureResult['level'] = 'LOW';
  if (memoryUsedPercent > 80 || contextDriftPercent > 40) level = 'CRITICAL';
  else if (memoryUsedPercent > 65 || contextDriftPercent > 30) level = 'HIGH';
  else if (memoryUsedPercent > 50 || contextDriftPercent > 20) level = 'MODERATE';

  const recommendations = [
    level === 'CRITICAL' ? 'CRITICAL: Consider checkpointing immediately' : null,
    level === 'HIGH' ? 'Monitor drift closely; prepare for compression' : null,
    tokenBurnRatePerMin > 50 ? 'High token burn detected; reduce output verbosity' : null,
  ].filter(Boolean) as string[];

  return { level, sessionAgeSeconds, memoryUsedPercent, tokenBurnRatePerMin, contextDriftPercent, recommendations };
}

// -- Verbosity --------------------------------------------------------------

export interface VerbosityInput {
  recentOutputLengths: number[];
  expectedBaseline: number;
  tokenBudgetUsed: number;
  tokenBudgetTotal: number;
}

export interface VerbosityResult {
  level: 'OPTIMAL' | 'DRIFTING' | 'EXCESSIVE';
  driftPercent: number;
  avgOutputLength: number;
  expectedBaseline: number;
  recommendations: string[];
}

export function evaluateVerbosity(input: VerbosityInput): VerbosityResult {
  const { recentOutputLengths, expectedBaseline, tokenBudgetUsed, tokenBudgetTotal } = input;

  if (recentOutputLengths.length === 0) {
    return { level: 'OPTIMAL', driftPercent: 0, avgOutputLength: 0, expectedBaseline, recommendations: [] };
  }

  const safeBaseline = Math.max(expectedBaseline, 1);
  const avgOutputLength = recentOutputLengths.reduce((a, b) => a + b, 0) / recentOutputLengths.length;
  const driftPercent = ((avgOutputLength - safeBaseline) / safeBaseline) * 100;

  let level: VerbosityResult['level'] = 'OPTIMAL';
  if (driftPercent > 30) level = 'EXCESSIVE';
  else if (driftPercent > 15) level = 'DRIFTING';

  const recommendations = [
    level === 'EXCESSIVE' ? 'CRITICAL: Reduce output length immediately' : null,
    level === 'DRIFTING' ? 'Monitor verbosity; trim unnecessary content' : null,
    tokenBudgetUsed / tokenBudgetTotal > 0.8 ? 'Token budget running low; compress aggressively' : null,
  ].filter(Boolean) as string[];

  return { level, driftPercent: parseFloat(driftPercent.toFixed(1)), avgOutputLength: parseFloat(avgOutputLength.toFixed(1)), expectedBaseline, recommendations };
}

// -- Half-Life --------------------------------------------------------------

export interface HalfLifeInput {
  sessionAgeMinutes: number;
  memoryPressure: number;
  contextDrift: number;
  tokenRemaining: number;
  tokenTotal: number;
  errorCount: number;
}

export interface HalfLifeResult {
  estimatedHalfLifeMinutes: number;
  stability: 'STABLE' | 'DECAYING' | 'FRAGILE';
  sessionAgeMinutes: number;
  tokenBurnRatePerMin: number;
  minutesUntilExhaustion: number;
  recommendations: string[];
}

export function evaluateHalfLife(input: HalfLifeInput): HalfLifeResult {
  const { sessionAgeMinutes, memoryPressure, contextDrift, tokenRemaining, tokenTotal, errorCount } = input;

  const tokenBurnRate = (tokenTotal - tokenRemaining) / Math.max(sessionAgeMinutes, 1);
  const minutesUntilTokenExhaustion = tokenRemaining / Math.max(tokenBurnRate, 1);
  const decayRate = (memoryPressure + contextDrift) / 100;
  const estimatedHalfLifeMinutes = minutesUntilTokenExhaustion / (1 + decayRate);

  let stability: HalfLifeResult['stability'] = 'STABLE';
  if (estimatedHalfLifeMinutes < 10) stability = 'FRAGILE';
  else if (estimatedHalfLifeMinutes < 30) stability = 'DECAYING';

  const recommendations = [
    stability === 'FRAGILE' ? 'URGENT: Session ending soon; checkpoint immediately' : null,
    stability === 'DECAYING' ? 'Stability declining; prepare for graceful shutdown' : null,
    errorCount > 3 ? 'Multiple errors detected; consider restart' : null,
  ].filter(Boolean) as string[];

  return {
    estimatedHalfLifeMinutes: Math.round(estimatedHalfLifeMinutes),
    stability,
    sessionAgeMinutes,
    tokenBurnRatePerMin: Math.round(tokenBurnRate * 10) / 10,
    minutesUntilExhaustion: Math.round(minutesUntilTokenExhaustion),
    recommendations,
  };
}
