import { SkynetClient } from '../api/client.js';
import { renderPanel } from '../output/renderer.js';
import { evaluateContextPressure, renderPressureLevel, suggestAgentAction } from '../output/context-pressure-regulator.js';
import * as readline from 'readline';

/**
 * CLI: skynet pressure [--interactive]
 * Interactive context pressure evaluation tool.
 */

async function promptUser(question: string, defaultValue: string): Promise<number> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} [${defaultValue}]: `, (answer) => {
      rl.close();
      const value = answer.trim() === '' ? defaultValue : answer;
      resolve(parseFloat(value));
    });
  });
}

export async function pressureCommand(client: SkynetClient, interactive: boolean = false): Promise<string> {
  let output = '';

  if (interactive) {
    console.log('\n┌─ Context Pressure Regulator (Interactive) ─┐\n');

    const memoryUsedPercent = await promptUser('Memory used (%)', '45');
    const tokenBurnRatePerMin = await promptUser('Token burn rate (t/min)', '35');
    const contextDriftPercent = await promptUser('Context drift (%)', '20');
    const sessionAgeSeconds = await promptUser('Session age (seconds)', '600');
    const tokenBudgetTotal = await promptUser('Token budget total', '100000');
    const tokenBudgetUsed = await promptUser('Token budget used', '35000');
    const contextWindowMaxBytes = await promptUser('Context window max (bytes)', '200000');
    const contextWindowUsedBytes = await promptUser('Context window used (bytes)', '90000');

    const pressure = evaluateContextPressure({
      memoryUsedPercent,
      tokenBurnRatePerMin,
      contextDriftPercent,
      sessionAgeSeconds,
      tokenBudgetTotal,
      tokenBudgetUsed,
      contextWindowMaxBytes,
      contextWindowUsedBytes,
      systemMode: 'production',
    });

    output += renderPressurePanel(pressure);
  } else {
    // Default simulation: typical production session
    const pressure = evaluateContextPressure({
      memoryUsedPercent: 55,
      tokenBurnRatePerMin: 38,
      contextDriftPercent: 25,
      sessionAgeSeconds: 900,
      tokenBudgetTotal: 100000,
      tokenBudgetUsed: 42500,
      contextWindowMaxBytes: 200000,
      contextWindowUsedBytes: 110000,
      systemMode: 'production',
    });

    output += renderPressurePanel(pressure);
  }

  return output;
}

/**
 * Render full pressure evaluation panel.
 */
function renderPressurePanel(pressure: any): string {
  const rows: Array<{ key: string; value: string | number | boolean }> = [];

  rows.push({ key: 'Pressure Level', value: renderPressureLevel(pressure) });
  rows.push({ key: 'Session Viability', value: `${pressure.sessionViability}/100` });
  rows.push({ key: 'Memory Pressure', value: `${pressure.memoryPressure}%` });
  rows.push({ key: 'Token Burn Rate', value: `${pressure.tokenBurnRate}/100 normalized` });
  rows.push({ key: 'Context Drift', value: `${pressure.contextDrift}%` });

  rows.push({ key: 'Tokens Remaining', value: pressure.estimatedTokensRemaining });
  rows.push({ key: 'Minutes Remaining', value: `${pressure.estimatedMinutesRemaining} min` });
  rows.push({ key: 'Burn Rate Accel', value: `${pressure.burnRateAcceleration}x baseline` });

  let actionOutput = renderPanel('PRESSURE EVALUATION', rows);

  // Recommendations
  const recRows: Array<{ key: string; value: string | boolean }> = [];
  recRows.push({ key: 'Compress', value: pressure.recommendations.shouldCompress ? '✓ YES' : '✗ no' });
  recRows.push({ key: 'Optimize', value: pressure.recommendations.shouldOptimize ? '✓ YES' : '✗ no' });
  recRows.push({ key: 'Terminate', value: pressure.recommendations.shouldTerminate ? '✓ YES' : '✗ no' });
  recRows.push({ key: 'Priority', value: pressure.recommendations.priority.toUpperCase() });

  const suggestedAction = suggestAgentAction(pressure);
  recRows.push({ key: 'Suggested Action', value: suggestedAction.toUpperCase() });

  actionOutput += '\n\n';
  actionOutput += renderPanel('RECOMMENDATIONS', recRows);

  // Thresholds
  if (pressure.thresholdsExceeded.length > 0) {
    actionOutput += '\n\n';
    const thresholdRows = [
      { key: 'Count', value: pressure.thresholdsExceeded.length },
      ...pressure.thresholdsExceeded.map((t: string) => ({
        key: '→',
        value: t.replace(/_/g, ' ').toUpperCase(),
      })),
    ];
    actionOutput += renderPanel('THRESHOLDS EXCEEDED', thresholdRows);
  }

  return actionOutput;
}
