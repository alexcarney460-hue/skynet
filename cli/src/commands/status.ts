import { SkynetClient } from '../api/client.js';
import { section, pair, DIVIDER, info } from '../output/format.js';
import { getToken } from '../auth/storage.js';

const VERSION = '1.0.0';
const API_VERSION = 'v1.0';

export async function statusCommand(client: SkynetClient): Promise<string> {
  const token = getToken();

  let output = '';
  output += section('SYSTEM STATUS') + '\n';

  try {
    const artifacts = await client.listArtifacts();
    output += pair('Registry State', 'INDEXED') + '\n';
    output += pair('Artifacts Online', artifacts.length) + '\n';
  } catch {
    output += pair('Registry State', 'OFFLINE') + '\n';
  }

  if (token) {
    try {
      const entitlements = await client.getEntitlements();
      output += pair('Auth State', 'AUTHENTICATED') + '\n';
      output += pair('User ID', entitlements.user_id.substring(0, 8) + '...') + '\n';
      output += pair('Full Unlock', entitlements.full_unlock) + '\n';
      output += pair('Unlocked Artifacts', entitlements.unlocked_artifacts.length) + '\n';
    } catch {
      output += pair('Auth State', 'STALE') + '\n';
    }
  } else {
    output += pair('Auth State', 'UNAUTHENTICATED') + '\n';
  }

  output += pair('API Version', API_VERSION) + '\n';
  output += pair('CLI Version', VERSION) + '\n';
  output += DIVIDER;

  return output;
}
