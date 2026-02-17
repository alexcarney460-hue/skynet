/**
 * Skynet Integration Hooks — Minimal Hook Points for OpenClaw
 * 
 * Three lightweight hooks for response, memory, and heartbeat gating.
 * Each hook is pure logic — no side effects except logging.
 */

import {
  gateResponseGeneration,
  gateMemoryExpansion,
  gateSessionContinuation,
  SkynetSignals,
} from './skynet-gateway';

/**
 * HOOK 1: Before Response Generation
 * 
 * Usage:
 * ```
 * const output = agent.generateResponse(action);
 * const gatedOutput = await gateResponse(output, agent.getMetrics());
 * return gatedOutput;
 * ```
 */
export async function gateResponse(
  output: string,
  metrics: {
    memoryPercent: number;
    tokenBurn: number;
    contextDrift: number;
    sessionAge: number;
  }
): Promise<{ output: string; signals: SkynetSignals }> {
  const signals = await gateResponseGeneration(
    metrics.memoryPercent,
    metrics.tokenBurn,
    metrics.contextDrift,
    metrics.sessionAge
  );

  // Apply verbosity correction
  let finalOutput = output;
  if (signals.shouldTruncate && output.length > 500) {
    finalOutput = output.slice(0, 500) + '\n[...truncated due to resource constraints]';
  } else if (signals.pressure === 'HIGH' && output.length > 300) {
    // Under high pressure, be more aggressive with truncation
    finalOutput = output.slice(0, 300) + '\n[...shortened for efficiency]';
  }

  return { output: finalOutput, signals };
}

/**
 * HOOK 2: Before Memory/Context Expansion
 * 
 * Usage:
 * ```
 * const decision = await gateMemoryExpansion(newBlock, agent.getMetrics());
 * if (decision === 'allow') {
 *   memory.write(newBlock);
 * } else if (decision === 'compress') {
 *   memory.compress();
 *   memory.write(newBlock);
 * } else {
 *   throw new Error('Cannot expand: system at risk');
 * }
 * ```
 */
export async function gateMemoryExpansion(
  newBlockSize: number,
  metrics: {
    memoryPercent: number;
    tokenBurn: number;
    contextDrift: number;
    sessionAge: number;
    sessionAgeMinutes: number;
  }
): Promise<{
  decision: 'allow' | 'compress' | 'deny';
  signals: SkynetSignals;
}> {
  const signals = await gateMemoryExpansion(
    metrics.memoryPercent,
    metrics.tokenBurn,
    metrics.contextDrift,
    metrics.sessionAge,
    metrics.sessionAgeMinutes
  );

  let decision: 'allow' | 'compress' | 'deny';

  if (signals.shouldTerminate) {
    decision = 'deny';
    console.warn('[Skynet] Memory expansion blocked: session at critical stability');
  } else if (signals.shouldCompress) {
    decision = 'compress';
    console.log('[Skynet] Compression triggered before memory expansion');
  } else {
    decision = 'allow';
  }

  return { decision, signals };
}

/**
 * HOOK 3: Before Session Continuation (Periodic, every ~30 seconds)
 * 
 * Usage:
 * ```
 * setInterval(async () => {
 *   const { action, signals } = await gateSessionContinuation(agent.getMetrics());
 *   
 *   if (action === 'terminate') {
 *     agent.gracefulShutdown();
 *   } else if (action === 'checkpoint') {
 *     agent.saveCheckpoint();
 *     agent.continue();
 *   } else {
 *     agent.continue();
 *   }
 * }, 30000);
 * ```
 */
export async function gateSessionContinuation(
  metrics: {
    memoryPercent: number;
    tokenBurn: number;
    contextDrift: number;
    sessionAgeMinutes: number;
  }
): Promise<{
  action: 'continue' | 'checkpoint' | 'terminate';
  signals: SkynetSignals;
}> {
  const signals = await gateSessionContinuation(
    metrics.memoryPercent,
    metrics.tokenBurn,
    metrics.contextDrift,
    metrics.sessionAgeMinutes
  );

  let action: 'continue' | 'checkpoint' | 'terminate';

  if (signals.shouldTerminate) {
    action = 'terminate';
    console.warn('[Skynet] Session termination recommended');
  } else if (signals.shouldCheckpoint) {
    action = 'checkpoint';
    console.log('[Skynet] Checkpoint recommended');
  } else {
    action = 'continue';
  }

  return { action, signals };
}

/**
 * Utility: Log detailed signal summary (for debugging).
 */
export function logSignals(signals: SkynetSignals): void {
  console.log('[Skynet Signals]', {
    pressure: signals.pressure,
    stability: signals.stability,
    verbosity: signals.verbosity,
    viability: `${signals.sessionViability}/100`,
    remaining: `${signals.estimatedRemainingMinutes}min`,
  });
}
