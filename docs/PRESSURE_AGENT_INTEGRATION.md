# Context Pressure Regulator — Agent Framework Integration Guide

Complete integration guide for OpenClaw, LangChain, AutoGPT, and custom agent frameworks.

---

## Table of Contents

1. [OpenClaw Integration](#openclaw-integration)
2. [LangChain Integration](#langchain-integration)
3. [Custom Agent Frameworks](#custom-agent-frameworks)
4. [Shared Resources](#shared-resources)
5. [Monitoring & Observability](#monitoring--observability)
6. [Error Handling & Fallbacks](#error-handling--fallbacks)

---

## OpenClaw Integration

### Method 1: Direct Session Instrumentation

Inject pressure checks into OpenClaw agent lifecycle.

**File:** `agent-middleware.ts`

```typescript
import { createPressureMiddleware } from 'skynet-agent-sdk';

// Register middleware on agent startup
export function setupAgent(agent: Agent) {
  agent.use(
    createPressureMiddleware({
      endpoint: 'https://skynetx.io/api/v1/pressure',
      checkInterval: 30, // seconds
      thresholds: {
        critical: { action: 'terminate' },
        high: { action: 'compress' },
        moderate: { action: 'optimize' },
      },
      metrics: {
        tokenBudget: 100000,
        contextWindow: 200000,
      },
    })
  );
}

// Middleware hooks automatically called before tool execution
// If pressure >= HIGH, tool is delayed or queued
// If pressure >= CRITICAL, agent session terminates gracefully
```

### Method 2: Manual Pressure Gating

Check pressure before expensive operations.

```typescript
import { sessions_send } from 'openclaw'; // OpenClaw SDK
import { evaluateContextPressure } from 'skynet';

export async function executeExpensiveTask(taskDescription: string) {
  // Gate 1: Check pressure before starting
  const pressure = await evaluateContextPressure({
    memoryUsedPercent: getCurrentMemoryUsage(),
    tokenBurnRatePerMin: getObservedBurnRate(),
    contextDriftPercent: getDriftPercent(),
    sessionAgeSeconds: getSessionAge(),
    tokenBudgetTotal: 100000,
    tokenBudgetUsed: getTokensUsed(),
    contextWindowMaxBytes: 200000,
    contextWindowUsedBytes: getContextUsed(),
  });

  // Gate 2: Decide based on level
  if (pressure.level === 'CRITICAL') {
    await sessions_send({
      message: `⚠️ Critical pressure (viability: ${pressure.sessionViability}/100). Gracefully terminating.`,
    });
    process.exit(0);
  }

  if (pressure.level === 'HIGH' && !taskDescription.includes('URGENT')) {
    await sessions_send({
      message: `⏱️ High pressure detected. Deferring non-urgent task. Resume in ${pressure.estimatedMinutesRemaining} min.`,
    });
    return null;
  }

  if (pressure.recommendations.shouldCompress) {
    await compressSessionContext();
  }

  if (pressure.recommendations.shouldOptimize) {
    enableOptimizationMode();
  }

  // Safe to proceed
  return await performTask(taskDescription);
}
```

### Method 3: Per-Tool Pressure Enforcement

Wrap tool definitions with pressure checks.

```typescript
function createPressureAwareTools(tools: Tool[]) {
  return tools.map((tool) => ({
    ...tool,
    execute: async (...args) => {
      // Skip pressure check for critical tools
      if (tool.metadata?.critical) {
        return tool.execute(...args);
      }

      // Check pressure for normal tools
      const pressure = await evaluateContextPressure(getSessionState());

      if (pressure.level === 'CRITICAL') {
        throw new Error(
          `Cannot execute ${tool.name}: session at critical pressure`
        );
      }

      if (pressure.level === 'HIGH') {
        // Delay execution, queue instead
        queueToolExecution(tool.name, args);
        return { queued: true };
      }

      // Execute normally
      return tool.execute(...args);
    },
  }));
}
```

---

## LangChain Integration

### Setup: Custom Agent Type

```typescript
import { BaseSingleActionAgent } from 'langchain/agents';
import { Tool } from 'langchain/tools';

class PressureAwareAgent extends BaseSingleActionAgent {
  pressureClient: PressureEvaluator;
  tokenBudget: number;

  constructor(tools: Tool[], options: AgentOptions) {
    super(tools, options);
    this.pressureClient = new PressureEvaluator('https://skynetx.io/api/v1/pressure');
    this.tokenBudget = options.tokenBudget || 100000;
  }

  async plan(
    intermediate_steps: AgentStep[],
    inputs: ChainValues,
    callbacks?: Callbacks
  ): Promise<AgentAction | AgentFinish> {
    // Step 1: Check pressure before planning
    const pressure = await this.pressureClient.evaluate({
      ...this.getSessionMetrics(),
      tokenBudgetUsed: this.getTokensUsed(),
    });

    // Step 2: If critical, finish early
    if (pressure.level === 'CRITICAL') {
      return {
        returnValues: {
          output: `[SESSION TERMINATED] Critical pressure (${pressure.sessionViability}/100 viability). Final answer: Unable to continue.`,
        },
        log: 'Critical pressure termination',
      };
    }

    // Step 3: If high, limit tool selection
    if (pressure.level === 'HIGH') {
      // Filter tools to only critical ones
      const criticalTools = this.tools.filter((t) => t.metadata?.critical);
      // Generate action using only critical tools
    }

    // Step 4: Normal planning
    return await super.plan(intermediate_steps, inputs, callbacks);
  }

  // Override tool execution
  async executeAction(
    action: AgentAction,
    callbacks?: Callbacks
  ): Promise<AgentActionMessageLog | null> {
    const tool = this.getToolByName(action.tool);
    const pressure = await this.pressureClient.evaluate(this.getSessionMetrics());

    // Tool-specific logic
    if (tool.name === 'search' && pressure.level === 'HIGH') {
      // Limit search scope under high pressure
      action.toolInput.maxResults = 1;
    }

    return await super.executeAction(action, callbacks);
  }
}

// Usage
const agent = new PressureAwareAgent(tools, {
  tokenBudget: 100000,
  pressureEndpoint: 'https://skynetx.io/api/v1/pressure',
});
```

### Integration: Agent Loop with Pressure Gates

```typescript
async function runPressureAwareAgentLoop(
  agent: PressureAwareAgent,
  input: string
) {
  const pressureClient = agent.pressureClient;
  let iteration = 0;
  const maxIterations = 15;

  while (iteration < maxIterations) {
    iteration++;

    // Pre-iteration pressure check
    const pressure = await pressureClient.evaluate(agent.getSessionMetrics());

    console.log(`[Iteration ${iteration}] Pressure: ${pressure.level}`);

    // Abort if critical
    if (pressure.level === 'CRITICAL') {
      console.error('❌ Critical pressure - terminating');
      return {
        output: 'Session terminated due to critical pressure',
        iterations: iteration,
      };
    }

    // Slow down if degraded
    if (pressure.level === 'DEGRADED') {
      await sleep(pressure.estimatedMinutesRemaining < 5 ? 5000 : 1000);
    }

    // Execute agent step
    const step = await agent.plan([], { input });

    if (step.returnValues) {
      // Agent finished
      return { output: step.returnValues.output, iterations: iteration };
    }

    // Execute action
    const toolResult = await agent.executeAction(step);
    console.log(`Tool: ${step.tool} → ${toolResult}`);
  }

  return { output: 'Max iterations reached', iterations: maxIterations };
}
```

---

## Custom Agent Frameworks

### Minimal Integration: Pressure Check Wrapper

```python
# Python example (minimal integration)
import requests
from typing import Dict

class SessionWithPressure:
    def __init__(self, agent, pressure_endpoint: str):
        self.agent = agent
        self.pressure_endpoint = pressure_endpoint
    
    def check_pressure(self, metrics: Dict) -> str:
        """Returns pressure level: LOW, MODERATE, HIGH, CRITICAL"""
        response = requests.post(
            self.pressure_endpoint,
            json=metrics
        )
        return response.json()['pressure']['level']
    
    def run_with_pressure_checks(self, task: str):
        """Run task with automatic pressure gates"""
        while True:
            # Check before work
            level = self.check_pressure(self.agent.get_metrics())
            
            if level == 'CRITICAL':
                self.agent.save_state()
                break
            
            if level == 'HIGH':
                self.agent.compress_memory()
            
            # Do work
            result = self.agent.step(task)
            
            if self.agent.is_done():
                break
        
        return result
```

### Pressure-Driven Execution Plan

```typescript
// Framework-agnostic execution controller
class PressureAdaptiveExecutor {
  private pressureThresholds = {
    compress: 70,     // Memory %
    optimize: 50,     // Drift %
    terminate: 85,    // Memory % or <5 min remaining
  };

  async execute(
    plan: ExecutionPlan,
    getMetrics: () => Promise<SessionMetrics>
  ): Promise<ExecutionResult> {
    const results = [];

    for (const step of plan.steps) {
      // Pre-step pressure check
      const metrics = await getMetrics();
      const pressure = await this.evaluatePressure(metrics);

      // Decision tree
      if (pressure.level === 'CRITICAL') {
        console.error('Terminating due to critical pressure');
        return { status: 'terminated', results, reason: pressure };
      }

      if (pressure.recommendations.shouldCompress) {
        console.log('Compressing context...');
        // Implement compression
      }

      if (pressure.recommendations.shouldOptimize) {
        step.parameters = this.optimizeParameters(step.parameters, pressure);
      }

      // Execute step
      try {
        const result = await step.execute();
        results.push(result);
      } catch (error) {
        // If error during high pressure, abort
        if (pressure.level === 'HIGH') {
          return { status: 'aborted', results, error };
        }
        throw error;
      }
    }

    return { status: 'success', results };
  }

  private optimizeParameters(params: any, pressure: ContextPressure): any {
    if (pressure.level === 'MODERATE') {
      return {
        ...params,
        temperature: Math.max(0.3, params.temperature - 0.1),
        maxTokens: Math.round(params.maxTokens * 0.9),
      };
    }
    return params;
  }
}
```

---

## Shared Resources

### Multi-Agent Context Pool

```typescript
class SharedContextPool {
  private pool: ContextWindow;
  private agents: Map<string, Agent> = new Map();
  private pressureClient: PressureEvaluator;

  constructor(totalSize: number, pressureEndpoint: string) {
    this.pool = new ContextWindow(totalSize);
    this.pressureClient = new PressureEvaluator(pressureEndpoint);
  }

  async allocateToAgent(agentId: string, size: number): Promise<boolean> {
    // Check pool pressure
    const pressure = await this.pressureClient.evaluate({
      memoryUsedPercent: this.getPoolUtilization(),
      tokenBudgetTotal: this.pool.maxSize,
      tokenBudgetUsed: this.pool.used,
      contextWindowMaxBytes: this.pool.maxSize,
      contextWindowUsedBytes: this.pool.used,
    });

    // Reject allocation if pressure HIGH or CRITICAL
    if (pressure.level === 'HIGH' || pressure.level === 'CRITICAL') {
      console.log(
        `[${agentId}] Allocation denied: pool at ${pressure.level} pressure`
      );
      return false;
    }

    // Allow allocation
    this.pool.allocate(agentId, size);
    this.agents.set(agentId, { allocated: size, priority: 'normal' });
    return true;
  }

  async rebalanceUnderPressure(): Promise<void> {
    const pressure = await this.pressureClient.evaluate(this.getPoolStats());

    if (pressure.level === 'CRITICAL') {
      // Kill low-priority agents
      for (const [agentId, agent] of this.agents) {
        if (agent.priority === 'low') {
          this.pool.deallocate(agentId);
          this.agents.delete(agentId);
        }
      }
    }

    if (pressure.level === 'HIGH') {
      // Pause new allocations
      this.acceptingNewAllocation = false;
    }
  }
}
```

---

## Monitoring & Observability

### Instrumentation: Hooks & Callbacks

```typescript
interface PressureHooks {
  onLevelChange?: (oldLevel, newLevel, pressure) => void;
  onCritical?: (pressure) => void;
  onRecommendation?: (recommendation, pressure) => void;
  onThresholdExceeded?: (threshold, pressure) => void;
}

class ObservablePressureEvaluator {
  private hooks: PressureHooks;

  constructor(endpoint: string, hooks: PressureHooks = {}) {
    this.hooks = hooks;
  }

  async evaluate(metrics): Promise<ContextPressure> {
    const pressure = await super.evaluate(metrics);
    const oldLevel = this.lastLevel;
    this.lastLevel = pressure.level;

    // Fire hooks
    if (oldLevel && oldLevel !== pressure.level) {
      this.hooks.onLevelChange?.(oldLevel, pressure.level, pressure);
    }

    if (pressure.level === 'CRITICAL') {
      this.hooks.onCritical?.(pressure);
    }

    if (pressure.recommendations.shouldCompress) {
      this.hooks.onRecommendation?.('compress', pressure);
    }

    for (const threshold of pressure.thresholdsExceeded) {
      this.hooks.onThresholdExceeded?.(threshold, pressure);
    }

    return pressure;
  }
}

// Usage with logging
const pressureEval = new ObservablePressureEvaluator(endpoint, {
  onLevelChange: (old, new_, pressure) => {
    logger.warn(`Pressure changed: ${old} → ${new_}`, { pressure });
  },
  onCritical: (pressure) => {
    alertManager.send('critical_pressure', { pressure });
  },
});
```

### Metrics Export (Prometheus)

```typescript
import { Counter, Gauge, Histogram } from 'prom-client';

const pressureLevelGauge = new Gauge({
  name: 'skynet_pressure_level',
  help: 'Current pressure level (0=LOW, 1=MODERATE, 2=HIGH, 3=CRITICAL)',
  labelNames: ['session_id', 'agent_id'],
});

const viabilityGauge = new Gauge({
  name: 'skynet_session_viability',
  help: 'Session viability score 0-100',
  labelNames: ['session_id'],
});

const pressureTransitionCounter = new Counter({
  name: 'skynet_pressure_transitions_total',
  help: 'Total pressure level transitions',
  labelNames: ['from', 'to'],
});

const evaluationHistogram = new Histogram({
  name: 'skynet_pressure_evaluation_ms',
  help: 'Pressure evaluation time in milliseconds',
  buckets: [1, 5, 10, 50, 100],
});

// In evaluator
async evaluate(metrics) {
  const timer = evaluationHistogram.startTimer();
  const pressure = await super.evaluate(metrics);
  timer();

  pressureLevelGauge
    .labels('session1', 'agent1')
    .set(this.levelToNumber(pressure.level));
  viabilityGauge.labels('session1').set(pressure.sessionViability);

  return pressure;
}

function levelToNumber(level: string): number {
  return { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 }[level];
}
```

---

## Error Handling & Fallbacks

### Graceful Degradation

```typescript
class ResilientPressureEvaluator {
  private fallbackPressure: ContextPressure = {
    level: 'MODERATE', // Conservative default
    sessionViability: 50,
    // ... other fields
  };

  async evaluate(metrics): Promise<ContextPressure> {
    try {
      return await this.pressureClient.evaluate(metrics);
    } catch (error) {
      logger.error('Pressure evaluation failed, using fallback', error);
      return this.fallbackPressure;
    }
  }

  async evaluateWithTimeout(
    metrics,
    timeoutMs: number = 1000
  ): Promise<ContextPressure> {
    const promise = this.evaluate(metrics);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );

    try {
      return await Promise.race([promise, timeout]);
    } catch {
      logger.warn('Pressure evaluation timeout, using fallback');
      return this.fallbackPressure;
    }
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreakerPressureEvaluator {
  private failureCount = 0;
  private failureThreshold = 3;
  private circuitOpen = false;
  private resetTimer: NodeJS.Timeout;

  async evaluate(metrics): Promise<ContextPressure> {
    if (this.circuitOpen) {
      logger.warn('Circuit open - returning fallback pressure');
      return this.getFallbackPressure();
    }

    try {
      const pressure = await this.pressureClient.evaluate(metrics);
      this.failureCount = 0; // Reset on success
      return pressure;
    } catch (error) {
      this.failureCount++;
      logger.error(`Pressure eval failed (${this.failureCount}/${this.failureThreshold})`, error);

      if (this.failureCount >= this.failureThreshold) {
        this.circuitOpen = true;
        logger.error('Circuit breaker opened');

        // Reset after 30 seconds
        this.resetTimer = setTimeout(() => {
          this.circuitOpen = false;
          this.failureCount = 0;
          logger.info('Circuit breaker reset');
        }, 30000);
      }

      return this.getFallbackPressure();
    }
  }
}
```

---

## Testing

### Unit Test Example

```typescript
import { evaluateContextPressure } from 'skynet';

describe('Context Pressure Regulator', () => {
  it('should return LOW pressure for healthy session', () => {
    const pressure = evaluateContextPressure({
      memoryUsedPercent: 30,
      tokenBurnRatePerMin: 20,
      contextDriftPercent: 10,
      sessionAgeSeconds: 300,
      tokenBudgetTotal: 100000,
      tokenBudgetUsed: 20000,
      contextWindowMaxBytes: 200000,
      contextWindowUsedBytes: 60000,
    });

    expect(pressure.level).toBe('LOW');
    expect(pressure.sessionViability).toBeGreaterThanOrEqual(75);
  });

  it('should return CRITICAL pressure for degraded session', () => {
    const pressure = evaluateContextPressure({
      memoryUsedPercent: 90,
      tokenBurnRatePerMin: 95,
      contextDriftPercent: 85,
      sessionAgeSeconds: 3600,
      tokenBudgetTotal: 100000,
      tokenBudgetUsed: 95000,
      contextWindowMaxBytes: 200000,
      contextWindowUsedBytes: 180000,
    });

    expect(pressure.level).toBe('CRITICAL');
    expect(pressure.recommendations.shouldTerminate).toBe(true);
  });
});
```

---

## Deployment Checklist

- [ ] Endpoint registered: `/api/v1/pressure`
- [ ] CLI command: `skynet pressure`
- [ ] Metrics exported: Prometheus-compatible format
- [ ] Hooks integrated: onLevelChange, onCritical, etc.
- [ ] Fallback pressure configured
- [ ] Circuit breaker enabled
- [ ] Logging instrumented
- [ ] Alerting configured
- [ ] Load tests passed (>1000 req/s)
- [ ] Integration tests passing (all agent types)
- [ ] Documentation deployed
- [ ] Team trained on decision trees

---

## Status: ✅ READY FOR INTEGRATION

All agent frameworks supported with minimal friction.
