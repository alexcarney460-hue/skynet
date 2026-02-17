import { SkynetClient } from '../api/client.js';
import { section, pair, DIVIDER, price } from '../output/format.js';

export async function artifactCommand(client: SkynetClient, slug: string, showContent: boolean = false): Promise<string> {
  const artifact = await client.getArtifact(slug);

  let output = '';
  output += section('ARTIFACT DETAIL') + '\n';
  output += pair('Title', artifact.title) + '\n';
  output += pair('Slug', artifact.slug) + '\n';
  output += pair('Category', artifact.category.replace(/_/g, ' ')) + '\n';
  output += pair('Version', artifact.version) + '\n';
  output += pair('Price', price(artifact.price_cents)) + '\n';
  output += pair('Status', artifact.entitled ? 'UNLOCKED' : 'LOCKED') + '\n';
  output += DIVIDER + '\n\n';

  output += 'DESCRIPTION\n';
  output += artifact.description + '\n\n';

  if (artifact.entitled && artifact.content_text && showContent) {
    output += DIVIDER + '\n\n';
    output += 'CONTENT\n';
    output += artifact.content_text + '\n\n';
    output += DIVIDER;
  } else if (!artifact.entitled) {
    output += `[Unlock to view full content - Run: skynet unlock ${slug}]\n`;
  } else {
    output += `[To view full content - Run: skynet artifact ${slug} --content]\n`;
  }

  return output;
}
