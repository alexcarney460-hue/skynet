import { SkynetClient } from '../api/client.js';
import { renderSectionHeader, renderArtifactTable, renderInfo } from '../output/renderer.js';
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
  output += renderSectionHeader(`ARTIFACTS (${artifacts.length} total)`);

  const tableData = artifacts.map(artifact => ({
    slug: artifact.slug,
    price_cents: artifact.price_cents,
    status: (entitlements?.full_unlock ||
      entitlements?.unlocked_artifacts.includes(artifact.id)
        ? 'UNLOCKED'
        : 'LOCKED') as 'LOCKED' | 'UNLOCKED',
  }));

  output += renderArtifactTable(tableData) + '\n\n';
  output += renderInfo('Run: skynet artifact <slug> for details');

  return output;
}
