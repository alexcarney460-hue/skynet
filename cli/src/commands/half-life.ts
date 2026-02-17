import { SkynetClient } from '../api/client.js';
import { renderPanel } from '../output/renderer.js';
import { estimateSessionHalfLife, renderStability, suggestHalfLifeAction } from '../output/session-half-life-estimator.js';

/**
 * CLI: skynet half-life
 * Estimate session stability and remaining useful lifetime.
 */

export async function halfLifeCommand(client: SkynetClient): Promise<string> {
  // Default scenario: session 30 min old with moderate decay
  const halfLife = estimateSessionHalfLife({
    sessionAgeMinutes: 30,
    currentMemoryPressurePercent: 48,
    currentContextDriftPercent: 26,
    tokenBudgetRemaining: 50000,
    tokenBudgetTotal: 100000,
    memoryPressureHistory: [40, 42, 44, 46, 48],
    contextDriftHistory: [20, 21, 23, 25, 26],
    tokenBurnRateHistory: [30, 32, 34, 35, 36],
    errorCountThisSession: 1,
    expectedSessionLengthMinutes: 120,
    systemMode: 'production',
  });

  let output = '';

  // Stability panel
  const rows: Array<{ key: string; value: string | number | boolean }> = [];
  rows.push({ key: 'Estimated Stability', value: renderStability(halfLife) });
  rows.push({ key: 'Decay Rate', value: halfLife.decayRate });
  rows.push({ key: 'Intervention Urgency', value: halfLife.interventionUrgency });

  rows.push({ key: 'Stability Score', value: `${halfLife.currentStabilityScore}/100` });
  rows.push({ key: 'Degradation Rate', value: `${halfLife.degradationRate}% per min` });

  rows.push({ key: 'Half-Life (50% quality)', value: `${halfLife.estimatedHalfLifeMinutes} min` });
  rows.push({ key: 'Remaining Useful Life', value: `${halfLife.estimatedRemainingLifeMinutes} min` });

  output += renderPanel('SESSION HALF-LIFE', rows);

  // Decay vectors panel
  const decayRows: Array<{ key: string; value: number }> = [];
  decayRows.push({ key: 'Memory Decay', value: halfLife.decayVectors.memoryDecay });
  decayRows.push({ key: 'Coherence Decay', value: halfLife.decayVectors.coherenceDecay });
  decayRows.push({ key: 'Token Depletion', value: halfLife.decayVectors.tokenDepletionRate });
  decayRows.push({ key: 'Error Tendency', value: halfLife.decayVectors.cumulativeErrorTendency });

  output += '\n\n';
  output += renderPanel('DECAY VECTORS', decayRows);

  // Recommendations panel
  const recRows: Array<{ key: string; value: string | boolean | number }> = [];
  recRows.push({
    key: 'Save Checkpoint',
    value: halfLife.recommendations.shouldSaveCheckpoint ? '✓ YES' : '✗ no',
  });
  recRows.push({
    key: 'Compress',
    value: halfLife.recommendations.shouldCompress ? '✓ YES' : '✗ no',
  });
  recRows.push({
    key: 'Terminate',
    value: halfLife.recommendations.shouldTerminate ? '⚠️  YES' : '✗ no',
  });
  recRows.push({
    key: 'Time Before Critical',
    value: `${halfLife.recommendations.estimatedTimeBeforeCritical} min`,
  });

  const suggestedAction = suggestHalfLifeAction(halfLife);
  recRows.push({ key: 'Suggested Action', value: suggestedAction.toUpperCase() });

  output += '\n\n';
  output += renderPanel('RECOMMENDATIONS', recRows);

  return output;
}
