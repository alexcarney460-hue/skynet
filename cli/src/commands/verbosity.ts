import { SkynetClient } from '../api/client.js';
import { renderPanel } from '../output/renderer.js';
import {
  assessVerbosityDrift,
  renderVerbosityState,
  suggestVerbosityAction,
} from '../output/verbosity-drift-suppressor.js';

/**
 * CLI: skynet verbosity
 * Assess output verbosity drift.
 */

export async function verbosityCommand(client: SkynetClient): Promise<string> {
  // Default scenario: session with mild verbosity drift
  const assessment = assessVerbosityDrift({
    recentOutputLengthsTokens: [155, 168, 175, 182, 190],
    totalOutputsThisSession: 24,
    totalTokensGeneratedThisSession: 4200,
    expectedBaselineTokensPerOutput: 150,
    systemMode: 'production',
    agentProfile: 'balanced',
    sessionAgeSeconds: 1800,
    tokenBudgetUsed: 50000,
    tokenBudgetTotal: 100000,
  });

  let output = '';

  // Main assessment panel
  const rows: Array<{ key: string; value: string | number | boolean }> = [];
  rows.push({ key: 'Verbosity State', value: renderVerbosityState(assessment) });
  rows.push({ key: 'Token Impact', value: assessment.tokenImpact });
  rows.push({ key: 'Correction Policy', value: assessment.correctionPolicy });

  rows.push({ key: 'Avg Output Length', value: `${assessment.avgOutputLengthTokens} tokens` });
  rows.push({ key: 'Baseline Expected', value: `${assessment.baselineOutputLengthTokens} tokens` });
  rows.push({ key: 'Drift', value: `${assessment.driftPercentage > 0 ? '+' : ''}${assessment.driftPercentage}%` });

  rows.push({ key: 'Total Outputs', value: assessment.outputCountThisSession });
  rows.push({ key: 'Wasted Tokens', value: assessment.cumulativeWastedTokens });

  output += renderPanel('VERBOSITY ASSESSMENT', rows);

  // Recommendations panel
  const recRows: Array<{ key: string; value: string | boolean }> = [];
  recRows.push({
    key: 'Reduce Detail',
    value: assessment.recommendations.reduceDetailLevel ? '✓ YES' : '✗ no',
  });
  recRows.push({
    key: 'Skip Meta',
    value: assessment.recommendations.skipMetaCommentary ? '✓ YES' : '✗ no',
  });
  recRows.push({
    key: 'Use Point Form',
    value: assessment.recommendations.usePointForm ? '✓ YES' : '✗ no',
  });
  recRows.push({
    key: 'Suppress Steps',
    value: assessment.recommendations.suppressIntermediateSteps ? '✓ YES' : '✗ no',
  });

  if (assessment.recommendations.truncateOutputAt) {
    recRows.push({
      key: 'Truncate At',
      value: `${assessment.recommendations.truncateOutputAt} tokens`,
    });
  }

  recRows.push({
    key: 'Enforce Limits',
    value: assessment.shouldEnforceLimits ? '⚠️  YES' : '✗ no',
  });

  const suggestedAction = suggestVerbosityAction(assessment);
  recRows.push({ key: 'Suggested Action', value: suggestedAction.toUpperCase() });

  output += '\n\n';
  output += renderPanel('RECOMMENDATIONS', recRows);

  if (assessment.shouldAlert) {
    output += '\n\n';
    output += renderPanel('ALERT', [
      {
        key: 'Status',
        value: '🚨 Excessive verbosity consuming significant token budget',
      },
    ]);
  }

  return output;
}
