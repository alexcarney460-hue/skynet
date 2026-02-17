/**
 * Skynet Gateway — Minimal Integration Layer for OpenClaw
 * 
 * Single source of truth for all Skynet signal queries.
 * Handles timeouts, errors, and fallback gracefully.
 */

const ENDPOINT = process.env.SKYNET_ENDPOINT || 'https://skynetx.io/api/v1';
const TIMEOUT_MS = 2000;

export interface SkynetSignals {
  // States
  pressure: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  verbosity: 'OPTIMAL' | 'DRIFTING' | 'EXCESSIVE';
  stability: 'STABLE' | 'DECAYING' | 'FRAGILE';

  // Decision flags
  shouldCompress: boolean;
  shouldOptimize: boolean;
  shouldTruncate: boolean;
  shouldTerminate: boolean;
  shouldCheckpoint: boolean;

  // Metadata
  sessionViability: number; // 0-100
  estimatedRemainingMinutes: number;
}

const SAFE_FALLBACK: SkynetSignals = {
  pressure: 'MODERATE',
  verbosity: 'OPTIMAL',
  stability: 'STABLE',
  shouldCompress: false,
  shouldOptimize: false,
  shouldTruncate: false,
  shouldTerminate: false,
  shouldCheckpoint: false,
  sessionViability: 50,
  estimatedRemainingMinutes: 60,
};

/**
 * Query Skynet pressure + verbosity before response generation.
 */
export async function gateResponseGeneration(
  memoryPercent: number,
  tokenBurn: number,
  contextDrift: number,
  sessionAge: number
): Promise<SkynetSignals> {
  try {
    const response = await fetchWithTimeout(
      `${ENDPOINT}/pressure`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryUsedPercent: memoryPercent,
          tokenBurnRatePerMin: tokenBurn,
          contextDriftPercent: contextDrift,
          sessionAgeSeconds: sessionAge,
        }),
      },
      TIMEOUT_MS
    );

    const data = await response.json();
    const p = data.pressure;

    return {
      pressure: p.level,
      verbosity: 'OPTIMAL',
      stability: 'STABLE',
      shouldCompress: p.recommendations.shouldCompress,
      shouldOptimize: p.recommendations.shouldOptimize,
      shouldTruncate: false,
      shouldTerminate: p.recommendations.shouldTerminate,
      shouldCheckpoint: false,
      sessionViability: p.sessionViability,
      estimatedRemainingMinutes: 60,
    };
  } catch (error) {
    logWarning('gateResponseGeneration', error);
    return SAFE_FALLBACK;
  }
}

/**
 * Query Skynet pressure + half-life before memory expansion.
 */
export async function gateMemoryExpansion(
  memoryPercent: number,
  tokenBurn: number,
  contextDrift: number,
  sessionAge: number,
  sessionAgeMinutes: number
): Promise<SkynetSignals> {
  try {
    const response = await fetchWithTimeout(
      `${ENDPOINT}/half-life`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionAgeMinutes,
          currentMemoryPressurePercent: memoryPercent,
          currentContextDriftPercent: contextDrift,
          tokenBurnRateHistory: [tokenBurn],
          errorCountThisSession: 0,
        }),
      },
      TIMEOUT_MS
    );

    const data = await response.json();
    const h = data.halfLife;

    return {
      pressure: 'MODERATE',
      verbosity: 'OPTIMAL',
      stability: h.estimatedStability,
      shouldCompress: h.recommendations.shouldCompress,
      shouldOptimize: false,
      shouldTruncate: false,
      shouldTerminate: h.recommendations.shouldTerminate,
      shouldCheckpoint: h.recommendations.shouldSaveCheckpoint,
      sessionViability: h.currentStabilityScore,
      estimatedRemainingMinutes: h.estimatedRemainingLifeMinutes,
    };
  } catch (error) {
    logWarning('gateMemoryExpansion', error);
    return SAFE_FALLBACK;
  }
}

/**
 * Query Skynet drift + half-life for session continuation check.
 */
export async function gateSessionContinuation(
  memoryPercent: number,
  tokenBurn: number,
  contextDrift: number,
  sessionAgeMinutes: number
): Promise<SkynetSignals> {
  try {
    // For session continuation, we primarily care about stability and drift
    const response = await fetchWithTimeout(
      `${ENDPOINT}/half-life`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionAgeMinutes,
          currentMemoryPressurePercent: memoryPercent,
          currentContextDriftPercent: contextDrift,
          tokenBurnRateHistory: [tokenBurn],
          errorCountThisSession: 0,
        }),
      },
      TIMEOUT_MS
    );

    const data = await response.json();
    const h = data.halfLife;

    return {
      pressure: 'MODERATE',
      verbosity: 'OPTIMAL',
      stability: h.estimatedStability,
      shouldCompress: false,
      shouldOptimize: false,
      shouldTruncate: false,
      shouldTerminate: h.recommendations.shouldTerminate,
      shouldCheckpoint: h.recommendations.shouldSaveCheckpoint,
      sessionViability: h.currentStabilityScore,
      estimatedRemainingMinutes: h.estimatedRemainingLifeMinutes,
    };
  } catch (error) {
    logWarning('gateSessionContinuation', error);
    return SAFE_FALLBACK;
  }
}

/**
 * Fetch with timeout (Node.js compatible).
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Log warnings without crashing.
 */
function logWarning(gate: string, error: any): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[Skynet] ${gate} failed: ${message}. Proceeding safely.`);
}

/**
 * Export for testing.
 */
export { SAFE_FALLBACK };
