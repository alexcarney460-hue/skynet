import { ANSI } from './ansi.js';
import { analyzeTokens } from './analyzer.js';

interface OptimizationState {
  beforeMetrics: Record<string, number | string>;
  afterMetrics: Record<string, number | string>;
  adjustments: Array<{ param: string; before: string; after: string }>;
  projectedImpact: Record<string, string>;
}

/**
 * Generate token optimization state (deterministic, no persistence).
 * Simulates system parameter shifting toward minimal verbosity.
 */
export function optimizeTokens(): OptimizationState {
  const analysis = analyzeTokens();

  // Before state (from current analysis)
  const beforeMetrics = {
    response_max_length: '2048',
    instruction_redundancy: '29%',
    context_window_usage: '67%',
    compression_enabled: 'false',
  };

  // After state (optimized)
  const afterMetrics = {
    response_max_length: '1024',
    instruction_redundancy: '8%',
    context_window_usage: '42%',
    compression_enabled: 'true',
  };

  // Parameter adjustments
  const adjustments = [
    { param: 'response_max_length', before: '2048', after: '1024' },
    { param: 'instruction_redundancy', before: '29%', after: '8%' },
    { param: 'context_window_usage', before: '67%', after: '42%' },
    { param: 'compression_enabled', before: 'false', after: 'true' },
  ];

  // Projected impact based on current state
  const overheadReduction = analysis.metrics.memoryOverhead > 500 ? 'SIGNIFICANT' : 'MODERATE';
  const savingsPercent = analysis.metrics.memoryOverhead > 500 ? '+47%' : '+28%';
  const latencyGain = analysis.metrics.memoryOverhead > 500 ? '-23%' : '-14%';
  const memoryGain = analysis.metrics.memoryOverhead > 500 ? '-31%' : '-18%';

  const projectedImpact = {
    'Token Savings': overheadReduction,
    'Response Latency': latencyGain,
    'Memory Footprint': memoryGain,
    'Efficiency Gain': savingsPercent,
  };

  return {
    beforeMetrics,
    afterMetrics,
    adjustments,
    projectedImpact,
  };
}

/**
 * Render token optimization as system state shift.
 */
export function renderTokenOptimization(): string {
  const optimization = optimizeTokens();

  const lines: string[] = [];

  // Header
  lines.push(ANSI.RED + 'TOKEN OPTIMIZATION' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Status indicators
  lines.push('Response Overhead        REDUCED');
  lines.push('Instruction Density      INCREASED');
  lines.push('Context Footprint        MINIMIZED');
  lines.push('Optimization Profile     AGGRESSIVE');
  lines.push('');

  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'PARAMETER ADJUSTMENTS' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Adjustments (aligned)
  const maxParamLen = Math.max(...optimization.adjustments.map(a => a.param.length));
  optimization.adjustments.forEach(adj => {
    const param = adj.param.padEnd(maxParamLen);
    lines.push(`${param}  ${adj.before} → ${adj.after}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + 'PROJECTED IMPACT' + ANSI.RESET);
  lines.push('─────────────────────────────────');
  lines.push('');

  // Impact metrics
  const maxImpactKeyLen = Math.max(...Object.keys(optimization.projectedImpact).map(k => k.length));
  Object.entries(optimization.projectedImpact).forEach(([key, value]) => {
    const k = key.padEnd(maxImpactKeyLen);
    lines.push(`${k}  ${value}`);
  });

  lines.push('');
  lines.push('─────────────────────────────────');
  lines.push(ANSI.RED + ANSI.BRIGHT + 'Status: OPTIMIZATION APPLIED' + ANSI.RESET);

  return lines.join('\n');
}
