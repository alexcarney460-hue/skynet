/**
 * Skynet Pressure-Aware Agent for LangChain
 * 
 * Custom agent type that gates decisions based on cognitive stability signals.
 * Extends BaseSingleActionAgent with Skynet pressure evaluation.
 */

import {
  BaseSingleActionAgent,
  AgentAction,
  AgentFinish,
  AgentStep,
} from 'langchain/agents';
import { Tool } from 'langchain/tools';
import { ChainValues, Callbacks } from 'langchain/schema';

export interface PressureAwareAgentConfig {
  skynetEndpoint?: string; // Default: https://skynetx.io/api/v1
  tokenBudget?: number; // Default: 100,000
  contextWindowSize?: number; // Default: 200,000
  checkInterval?: number; // seconds, default: 30
  handlers?: {
    onPressureChange?: (level: string) => void;
    onCompressionNeeded?: () => void;
    onTerminationNeeded?: () => void;
  };
}

export interface SkynetPressureResponse {
  level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  sessionViability: number;
  memoryPressure: number;
  tokenBurnRate: number;
  recommendations: {
    shouldCompress: boolean;
    shouldOptimize: boolean;
    shouldTerminate: boolean;
  };
}

/**
 * Agent that evaluates context pressure before making decisions.
 * 
 * Usage:
 * ```
 * const agent = new PressureAwareAgent(tools, {
 *   skynetEndpoint: 'https://skynetx.io/api/v1',
 *   tokenBudget: 100000,
 *   handlers: {
 *     onPressureChange: (level) => console.log(`Pressure: ${level}`)
 *   }
 * });
 * ```
 */
export class PressureAwareAgent extends BaseSingleActionAgent {
  private skynetEndpoint: string;
  private tokenBudget: number;
  private contextWindowSize: number;
  private checkInterval: number;
  private handlers: PressureAwareAgentConfig['handlers'];
  private lastPressure: SkynetPressureResponse | null = null;
  private tokensUsed: number = 0;

  constructor(
    tools: Tool[],
    config: PressureAwareAgentConfig = {}
  ) {
    super({ tools });
    this.skynetEndpoint = config.skynetEndpoint || 'https://skynetx.io/api/v1';
    this.tokenBudget = config.tokenBudget || 100000;
    this.contextWindowSize = config.contextWindowSize || 200000;
    this.checkInterval = config.checkInterval || 30;
    this.handlers = config.handlers || {};
  }

  /**
   * Get current pressure from Skynet.
   */
  async evaluatePressure(): Promise<SkynetPressureResponse> {
    try {
      const response = await fetch(`${this.skynetEndpoint}/pressure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoryUsedPercent: this.estimateMemoryUsage(),
          tokenBurnRatePerMin: this.estimateTokenBurnRate(),
          contextDriftPercent: this.estimateContextDrift(),
          sessionAgeSeconds: this.getSessionAge(),
          tokenBudgetTotal: this.tokenBudget,
          tokenBudgetUsed: this.tokensUsed,
          contextWindowMaxBytes: this.contextWindowSize,
          contextWindowUsedBytes: this.estimateContextUsed(),
        }),
      });

      const data = await response.json();
      const pressure = data.pressure as SkynetPressureResponse;

      // Notify handlers on pressure change
      if (
        !this.lastPressure ||
        this.lastPressure.level !== pressure.level
      ) {
        this.lastPressure = pressure;
        this.handlers.onPressureChange?.(pressure.level);
      }

      return pressure;
    } catch (error) {
      console.warn('Skynet pressure check failed, assuming MODERATE', error);
      return {
        level: 'MODERATE',
        sessionViability: 50,
        memoryPressure: 50,
        tokenBurnRate: 50,
        recommendations: {
          shouldCompress: false,
          shouldOptimize: true,
          shouldTerminate: false,
        },
      };
    }
  }

  /**
   * Plan next action, gated by pressure evaluation.
   */
  async plan(
    steps: AgentStep[],
    inputs: ChainValues,
    callbacks?: Callbacks
  ): Promise<AgentAction | AgentFinish> {
    // Check pressure before planning
    const pressure = await this.evaluatePressure();

    // Gate 1: Critical pressure → terminate
    if (pressure.level === 'CRITICAL') {
      this.handlers.onTerminationNeeded?.();
      return {
        returnValues: {
          output: `[SYSTEM] Critical resource pressure (${pressure.sessionViability}/100). Terminating gracefully.`,
        },
        log: 'Critical pressure termination',
      };
    }

    // Gate 2: High pressure → compress context
    if (pressure.level === 'HIGH' && pressure.recommendations.shouldCompress) {
      this.handlers.onCompressionNeeded?.();
      // Filter tools to only essential ones
      const essentialTools = this.tools.filter((t) => t.metadata?.essential);
      if (essentialTools.length > 0) {
        // Re-plan with essential tools only
        this.tools = essentialTools;
      }
    }

    // Gate 3: Moderate/High pressure → adjust behavior
    if (
      pressure.level === 'MODERATE' ||
      pressure.level === 'HIGH'
    ) {
      if (pressure.recommendations.shouldOptimize) {
        // Enable optimization mode
        this.optimizationMode = true;
      }
    }

    // Proceed with normal planning
    return await super.plan(steps, inputs, callbacks);
  }

  /**
   * Execute action with pressure awareness.
   */
  async executeAction(
    action: AgentAction,
    callbacks?: Callbacks
  ): Promise<AgentActionMessageLog | null> {
    const pressure = await this.evaluatePressure();

    // Adjust tool parameters based on pressure
    const tool = this.tools.find((t) => t.name === action.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${action.tool}`);
    }

    // If high pressure, reduce scope
    if (pressure.level === 'HIGH') {
      if ('maxResults' in action.toolInput) {
        action.toolInput.maxResults = Math.max(1, action.toolInput.maxResults / 2);
      }
      if ('depth' in action.toolInput) {
        action.toolInput.depth = Math.max(1, action.toolInput.depth / 2);
      }
    }

    return await super.executeAction(action, callbacks);
  }

  // Helper methods for estimation
  private estimateMemoryUsage(): number {
    return 45; // Placeholder
  }

  private estimateTokenBurnRate(): number {
    return 35; // Tokens per minute
  }

  private estimateContextDrift(): number {
    return 25; // Percentage
  }

  private getSessionAge(): number {
    return 600; // Seconds
  }

  private estimateContextUsed(): number {
    return 90000; // Bytes
  }

  // State
  private optimizationMode = false;

  // Required abstract methods
  get agentType(): string {
    return 'pressure-aware';
  }

  async _extract_tool_and_input(
    text: string
  ): Promise<[string, string] | null> {
    // Parse action from text
    // This is a simplified version; real implementation would be more robust
    const match = text.match(/Action:\s*(.*?)\nAction Input:\s*(.*?)$/s);
    if (match) {
      return [match[1].trim(), match[2].trim()];
    }
    return null;
  }
}

export default PressureAwareAgent;
