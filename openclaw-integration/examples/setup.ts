/**
 * Example: How to Integrate Skynet into an OpenClaw Agent
 * 
 * Three simple integration points, minimal code changes.
 */

import {
  gateResponse,
  gateMemoryExpansion,
  gateSessionContinuation,
} from '../src/hooks';

/**
 * INTEGRATION POINT 1: Response Generation
 * 
 * Hook location: Agent output handler
 * Impact: Automatic output truncation under high pressure
 * Code added: ~10 lines
 */
export async function enhanceResponseGeneration(agent: any) {
  const originalGenerate = agent.generateResponse.bind(agent);

  agent.generateResponse = async function (action: any) {
    const output = await originalGenerate(action);

    // [NEW] Gate response through Skynet
    const { output: gatedOutput, signals } = await gateResponse(output, {
      memoryPercent: agent.getMemoryPercent(),
      tokenBurn: agent.getTokenBurnRate(),
      contextDrift: agent.getContextDrift(),
      sessionAge: agent.getSessionAge(),
    });

    if (signals.pressure === 'HIGH' || signals.pressure === 'CRITICAL') {
      console.log(`[Skynet] Response gated (${signals.pressure} pressure)`);
    }

    return gatedOutput;
  };
}

/**
 * INTEGRATION POINT 2: Memory Expansion
 * 
 * Hook location: Memory/context manager
 * Impact: Automatic compression before expansion under high pressure
 * Code added: ~15 lines
 */
export async function enhanceMemoryManagement(memory: any) {
  const originalWrite = memory.write.bind(memory);

  memory.write = async function (block: any) {
    // [NEW] Gate memory expansion through Skynet
    const { decision, signals } = await gateMemoryExpansion(
      block.size,
      {
        memoryPercent: memory.getUtilizationPercent(),
        tokenBurn: memory.getAgent().getTokenBurnRate(),
        contextDrift: memory.getAgent().getContextDrift(),
        sessionAge: memory.getAgent().getSessionAge(),
        sessionAgeMinutes: memory.getAgent().getSessionAge() / 60,
      }
    );

    if (decision === 'deny') {
      throw new Error(
        '[Skynet] Cannot expand memory: session at critical stability'
      );
    }

    if (decision === 'compress') {
      console.log('[Skynet] Compressing memory before expansion');
      await memory.compress();
    }

    // Proceed with original write
    return originalWrite(block);
  };
}

/**
 * INTEGRATION POINT 3: Session Heartbeat
 * 
 * Hook location: Session manager heartbeat
 * Impact: Automatic checkpointing and graceful termination
 * Code added: ~20 lines
 */
export async function enhanceSessionHeartbeat(agent: any) {
  // Query Skynet every 30 seconds
  setInterval(async () => {
    const { action, signals } = await gateSessionContinuation({
      memoryPercent: agent.getMemoryPercent(),
      tokenBurn: agent.getTokenBurnRate(),
      contextDrift: agent.getContextDrift(),
      sessionAgeMinutes: agent.getSessionAge() / 60,
    });

    if (action === 'terminate') {
      console.log('[Skynet] Session termination: graceful shutdown');
      agent.gracefulShutdown();
    } else if (action === 'checkpoint') {
      console.log('[Skynet] Checkpoint: saving state');
      agent.saveCheckpoint();
    } else {
      // Continue normally
    }

    // Log signals for monitoring
    if (signals.stability === 'FRAGILE' || signals.stability === 'DECAYING') {
      console.warn('[Skynet] Stability concern:', {
        stability: signals.stability,
        viability: `${signals.sessionViability}/100`,
        remaining: `${signals.estimatedRemainingMinutes}min`,
      });
    }
  }, 30000);
}

/**
 * Complete Setup
 * 
 * Call this once during agent initialization.
 * Example:
 * ```
 * const agent = new OpenClawAgent(config);
 * await setupSkynetIntegration(agent);
 * ```
 */
export async function setupSkynetIntegration(agent: any): Promise<void> {
  console.log('[Skynet] Initializing cognitive middleware...');

  enhanceResponseGeneration(agent);
  enhanceMemoryManagement(agent.memory);
  enhanceSessionHeartbeat(agent);

  console.log('[Skynet] Integration complete. Agent is now cognitively aware.');
}

/**
 * Minimal integration (response gating only)
 * 
 * If you want to start small, just integrate this.
 */
export async function setupMinimalSkynetIntegration(agent: any): Promise<void> {
  enhanceResponseGeneration(agent);
  console.log('[Skynet] Minimal integration: response gating enabled.');
}
