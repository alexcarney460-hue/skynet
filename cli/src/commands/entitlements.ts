import { SkynetClient } from '../api/client.js';
import { section, pair, DIVIDER } from '../output/format.js';

export async function entitlementsCommand(client: SkynetClient): Promise<string> {
  const entitlements = await client.getEntitlements();

  let output = '';
  output += section('ENTITLEMENTS') + '\n';
  output += pair('User ID', entitlements.user_id.substring(0, 12) + '...') + '\n';
  output += pair('Full Unlock', entitlements.full_unlock) + '\n';
  output += pair('Individual Unlocks', entitlements.unlocked_artifacts.length) + '\n';
  output += DIVIDER + '\n';

  if (entitlements.unlocked_artifacts.length > 0) {
    output += '\nINDIVIDUAL UNLOCKS\n';
    entitlements.unlocked_artifacts.forEach(id => {
      output += `  ✓ ${id.substring(0, 20)}...\n`;
    });
  }

  return output;
}
