import { SkynetClient } from '../api/client.js';
import { section, DIVIDER, price } from '../output/format.js';
import { getToken } from '../auth/storage.js';
import { Entitlements } from '../types.js';

export async function artifactsCommand(client: SkynetClient): Promise<string> {
  const artifacts = await client.listArtifacts();
  
  let entitlements: Entitlements | null = null;
  const token = getToken();
  if (token) {
    try {
      entitlements = await client.getEntitlements();
    } catch {
      // silently fail
    }
  }

  let output = '';
  output += section(`ARTIFACTS (${artifacts.length} total)`) + '\n\n';

  artifacts.forEach(artifact => {
    const isUnlocked =
      entitlements?.full_unlock ||
      entitlements?.unlocked_artifacts.includes(artifact.id);
    
    const status = isUnlocked ? 'UNLOCKED' : 'LOCKED';
    const row = [
      artifact.slug.padEnd(35),
      price(artifact.price_cents).padStart(8),
      status.padStart(10),
    ].join('  ');
    
    output += row + '\n';
  });

  output += DIVIDER + '\n\n';
  output += 'Run: skynet artifact <slug> for details\n';

  return output;
}
