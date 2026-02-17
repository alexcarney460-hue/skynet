import { SkynetClient } from '../api/client.js';
import { renderPanel, renderSectionHeader, renderInfo, formatPrice } from '../output/renderer.js';

export async function artifactCommand(client: SkynetClient, slug: string, showContent: boolean = false): Promise<string> {
  const artifact = await client.getArtifact(slug);

  const rows = [
    { key: 'Title', value: artifact.title },
    { key: 'Category', value: artifact.category.replace(/_/g, ' ') },
    { key: 'Version', value: artifact.version },
    { key: 'Price', value: formatPrice(artifact.price_cents) },
    { key: 'Status', value: artifact.entitled ? 'UNLOCKED' : 'LOCKED' },
  ];

  let output = renderPanel('ARTIFACT', rows);

  output += '\nDESCRIPTION\n─────────────────────────────────\n\n';
  output += artifact.description + '\n';

  if (artifact.entitled && artifact.content_text && showContent) {
    output += '\n─────────────────────────────────\n\nCONTENT\n';
    output += artifact.content_text + '\n';
  } else if (!artifact.entitled) {
    output += '\n\n' + renderInfo(`Run: skynet unlock ${slug} to view full content`);
  } else {
    output += '\n\n' + renderInfo(`Run: skynet artifact ${slug} --content to view full content`);
  }

  return output;
}
