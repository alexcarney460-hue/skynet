import { SkynetClient } from '../api/client.js';
import { renderPanel, renderList } from '../output/renderer.js';

export async function entitlementsCommand(client: SkynetClient): Promise<string> {
  const entitlements = await client.getEntitlements();

  const rows = [
    { key: 'User ID', value: entitlements.user_id.substring(0, 12) + '...' },
    { key: 'Full Unlock', value: entitlements.full_unlock },
    { key: 'Individual Unlocks', value: entitlements.unlocked_artifacts.length },
  ];

  let output = renderPanel('ENTITLEMENTS', rows);

  if (entitlements.unlocked_artifacts.length > 0) {
    output += '\nUNLOCKED ARTIFACTS\n─────────────────────────────────\n\n';
    const items = entitlements.unlocked_artifacts.map(id => ({
      text: `${id.substring(0, 20)}...`,
      indent: 0,
    }));
    output += renderList(items);
  }

  return output;
}
