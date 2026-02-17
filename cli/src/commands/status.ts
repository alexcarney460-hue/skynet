import { SkynetClient } from '../api/client.js';
import { renderPanel } from '../output/renderer.js';
import { getToken } from '../auth/storage.js';

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

  rows.push({ key: 'API Version', value: API_VERSION });
  rows.push({ key: 'CLI Version', value: VERSION });

  return renderPanel('SYSTEM STATUS', rows);
}
