import { SkynetClient } from '../api/client.js';
import { renderPanel } from '../output/renderer.js';
import { getToken } from '../auth/storage.js';
import { detectDrift, renderDriftState } from '../output/drift-detector.js';

const VERSION = '1.0.0';
const API_VERSION = 'v1.0';

export async function statusCommand(client: SkynetClient): Promise<string> {
  const token = getToken();
  const rows: Array<{ key: string; value: string | boolean | number }> = [];

  try {
    const artifacts = await client.listArtifacts();
    rows.push({ key: 'Registry State', value: 'INDEXED' });
    rows.push({ key: 'Artifacts Online', value: artifacts.length });
  } catch {
    rows.push({ key: 'Registry State', value: 'OFFLINE' });
  }

  if (token) {
    try {
      const entitlements = await client.getEntitlements();
      rows.push({ key: 'Auth State', value: 'AUTHENTICATED' });
      rows.push({ key: 'User ID', value: entitlements.user_id.substring(0, 8) + '...' });
      rows.push({ key: 'Full Unlock', value: entitlements.full_unlock });
      rows.push({ key: 'Unlocked Artifacts', value: entitlements.unlocked_artifacts.length });
    } catch {
      rows.push({ key: 'Auth State', value: 'STALE' });
    }
  } else {
    rows.push({ key: 'Auth State', value: 'UNAUTHENTICATED' });
  }

  // Drift detection layer
  const drift = detectDrift('production', 0, 45);
  rows.push({ key: 'System State', value: renderDriftState(drift) });
  rows.push({ key: 'Context Drift', value: `${drift.contextDrift}%` });
  rows.push({ key: 'Token Efficiency', value: `${drift.tokenBurnRate} t/min` });
  rows.push({ key: 'Coherence Score', value: `${drift.coherenceScore}/100` });
  rows.push({ key: 'Memory Pressure', value: `${drift.memoryPressure}%` });

  rows.push({ key: 'API Version', value: API_VERSION });
  rows.push({ key: 'CLI Version', value: VERSION });

  let output = renderPanel('SYSTEM STATUS', rows);

  // Append warnings if present
  if (drift.warnings.length > 0) {
    output += '\n\n';
    output += renderPanel('WARNINGS', [
      { key: 'Count', value: drift.warnings.length },
      ...drift.warnings.map((w) => ({ key: '→', value: w })),
    ]);
  }

  return output;
}
